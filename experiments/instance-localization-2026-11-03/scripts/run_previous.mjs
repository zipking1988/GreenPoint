// Public RGB only. Sequential shared budget; failed requests are cached, never auto-retried.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../recognition-2026-11-03/vendor/landing/package.json', import.meta.url));
const sharp = require('sharp');
import { analyze, validatePayload } from '../../recognition-2026-11-03/vendor/landing/lib/meta-api.js';
import { plantEvidence } from '../../recognition-2026-11-03/vendor/landing/lib/plant-evidence.js';
import { classificationBatches } from '../../recognition-2026-11-03/vendor/landing/src/dashboard/evidence.js';
import { ExperimentBudget } from '../../recognition-2026-11-03/vendor/landing/scripts/budget.mjs';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { values } = parseArgs({ options: { phase: { type: 'string' }, geometry: { type: 'string' }, classify: { type: 'boolean', default: false }, live: { type: 'boolean', default: false } } });
if (!values.live || !process.env.MODEL_API_KEY) throw new Error('Requires explicit --live and server-only MODEL_API_KEY.');
if (!['development', 'evaluation', 'confirmation'].includes(values.phase)) throw new Error('Invalid phase');
if (!['whole', 'tiles640', 'tiles512'].includes(values.geometry)) throw new Error('Invalid geometry');
if (values.phase !== 'development') {
  const selection = JSON.parse(await readFile(join(root, '../recognition-2026-11-03/selection.json'), 'utf8'));
  if (values.geometry !== 'whole' && values.geometry !== selection.geometry) throw new Error('Evaluation geometry was not selected on development.');
}
const load = async p => JSON.parse(await readFile(p, 'utf8'));
const manifest = await load(join(root, 'manifest.json'));
const budget = new ExperimentBudget('/Users/zip/.codex/worktrees/color-refinement/GreenPoint/reviews/hackathon-sprint-2026-11-03/budget.json');
let fatal = false;
async function cached(path, create) {
  try { return await load(path); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (fatal) throw new Error('Provider authentication failed; stopped new requests.');
  const result = await create();
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path, JSON.stringify(result, null, 2) + '\n');
  return result;
}
async function paid(payload, label) {
  const reservation = await budget.reserve('instance-v2:previous:' + label, payload.action === 'segment' ? .0025 : .10);
  const start = performance.now();
  try {
    const result = await analyze(validatePayload(payload));
    await budget.settle(reservation, result.usage);
    return { ...result, elapsed_ms: Math.round(performance.now() - start) };
  } catch (error) {
    if ([401, 403].includes(error.status) || error.code === 'provider_auth') fatal = true;
    return { ...(payload.action === 'segment' ? { detections: [], limited: true } : { plants: [] }),
      error_code: error.code || 'request_failed', status: error.status || null, elapsed_ms: Math.round(performance.now() - start), usage: null };
  }
}
for (const item of manifest.items.filter(i => i.purpose === values.phase)) {
  const source = join(root, item.files.images.path);
  const geometry = values.geometry;
  const tileSize = geometry === 'tiles640' ? 640 : geometry === 'tiles512' ? 512 : 1024;
  const offsets = geometry === 'tiles640' ? [0, 384] : geometry === 'tiles512' ? [0, 256, 512] : [0];
  const views = [];
  for (const y of offsets) for (const x of offsets) {
    const file = join(root, 'sam', values.phase, geometry, item.id, `${x}-${y}.json`);
    const result = geometry === 'whole' && values.phase !== 'confirmation'
      ? await load(join(root, 'baseline/segments', item.id + '.json'))
      : await cached(file, async () => {
        const bytes = await sharp(source).extract({ left: x, top: y, width: tileSize, height: tileSize }).resize(1024, 1024).jpeg({ quality: 80 }).toBuffer();
        return paid({ action: 'segment', image: `data:image/jpeg;base64,${bytes.toString('base64')}`, width: 1024, height: 1024 }, `${values.phase}:${geometry}:${item.id}:${x}-${y}`);
      });
    views.push({ x, y, tileSize, modelSize: 1024, ...result });
    console.log(JSON.stringify({ phase: values.phase, geometry, image: item.id, x, y, candidates: result.detections.length, limited: result.limited, error: result.error_code || null }));
    if (fatal) throw new Error('Provider authentication rejected; reservation retained; no retries.');
  }
  const destination = join(root, 'sam', values.phase, geometry, item.id + '.json');
  await mkdir(resolve(destination, '..'), { recursive: true });
  await writeFile(destination, JSON.stringify({ image_id: item.id, geometry, views }, null, 2) + '\n');
  if (values.classify) {
    if (geometry !== 'whole') throw new Error('Original Muse comparison classifies whole-frame candidates only.');
    const bytes = await sharp(source).jpeg({ quality: 80 }).toBuffer();
    const plants = views[0].detections.map((p, i) => ({ ...p, id: `GP-${String(i + 1).padStart(3, '0')}`, label: 'uncertain', originalLabel: null }));
    const evidence = await Promise.all(plants.map(async p => ({ id: p.id, ...await plantEvidence(bytes, p.box, { context: false }) })));
    const errors = views[0].error_code ? [views[0].error_code] : [];
    const batches = classificationBatches(evidence);
    for (let index = 0; index < batches.length; index++) {
      const result = await cached(join(root, 'sam', values.phase, 'muse', item.id + `-${index}.json`), () => paid({ action: 'classify', crop: 'Sugar beet', plants: batches[index] }, `${values.phase}:muse:${item.id}:${index}`));
      if (result.error_code) { errors.push(result.error_code); break; }
      result.plants.forEach(p => Object.assign(plants.find(v => v.id === p.id), p));
      if (fatal) throw new Error('Provider authentication rejected.');
    }
    const dir = join(root, 'results', values.phase, 'current');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, item.id + '.json'), JSON.stringify({ image_id: item.id, plants, errors, limited: views[0].limited || errors.length > 0 }, null, 2) + '\n');
  }
}
