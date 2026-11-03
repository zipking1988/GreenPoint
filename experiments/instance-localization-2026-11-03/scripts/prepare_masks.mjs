// Decode with the same official parser as the product, then map tile pixels to source pixels.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { decodeMaskToRaster } from '../../recognition-2026-11-03/vendor/landing/node_modules/@meta-sam/parser/dist/index.js';
const require = createRequire(new URL('../../recognition-2026-11-03/vendor/landing/package.json', import.meta.url));
const sharp = require('sharp');
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { values } = parseArgs({ options: { phase: { type: 'string' }, geometry: { type: 'string' } } });
const json = async p => JSON.parse(await readFile(join(root, p), 'utf8'));
const manifest = await json('manifest.json');
for (const item of manifest.items.filter(i => i.purpose === values.phase)) {
  const geometry = values.geometry;
  const run = geometry === 'whole' && values.phase !== 'confirmation'
    ? { views: [{ x: 0, y: 0, tileSize: 1024, modelSize: 1024, ...await json(`baseline/segments/${item.id}.json`) }] }
    : await json(`sam/${values.phase}/${geometry}/${item.id}.json`);
  const plants = [], errors = [];
  let limited = false;
  for (const [vi, view] of run.views.entries()) {
    const s = view.tileSize / view.modelSize;
    limited ||= !!view.limited;
    if (view.error_code) errors.push(view.error_code);
    for (const [di, detection] of view.detections.entries()) {
      const id = `${geometry}-${vi}-${di}`;
      const [a, b, w, h] = detection.box;
      const plant = { id, box: [(view.x + a * view.tileSize) / 1024, (view.y + b * view.tileSize) / 1024, w * view.tileSize / 1024, h * view.tileSize / 1024],
        detectionConfidence: detection.detectionConfidence ?? null, provenance: { geometry, tile: [view.x, view.y, view.tileSize], model_box: detection.box } };
      if (detection.mask) {
        const m = detection.mask;
        const left = Math.max(0, Math.floor(view.x + m.bounds.left * s));
        const top = Math.max(0, Math.floor(view.y + m.bounds.top * s));
        const right = Math.min(1024, Math.ceil(view.x + m.bounds.right * s));
        const bottom = Math.min(1024, Math.ceil(view.y + m.bounds.bottom * s));
        const file = `masks/${values.phase}/${item.id}/${id}.png`;
        await mkdir(join(root, file, '..'), { recursive: true });
        const raster = decodeMaskToRaster(m);
        await sharp(Buffer.from(raster), { raw: { width: m.width, height: m.height, channels: 1 } })
          .resize(right - left, bottom - top, { kernel: 'nearest' }).png().toFile(join(root, file));
        plant.mask_file = file;
        plant.mask_bounds = [left, top, right, bottom];
      }
      plants.push(plant);
    }
  }
  const file = `candidates/${values.phase}/${geometry}/${item.id}.json`;
  await mkdir(join(root, file, '..'), { recursive: true });
  await writeFile(join(root, file), JSON.stringify({ image_id: item.id, source_sha256: item.files.images.sha256, geometry, plants, limited, errors }, null, 2) + '\n');
}
console.log(JSON.stringify({ prepared: values.phase, geometry: values.geometry }));
