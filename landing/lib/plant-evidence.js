import sharp from 'sharp';
import { evidenceRegion } from '../src/dashboard/evidence.js';

async function encode(source, region, size, limit, mark = false) {
  let image = sharp(source).extract({ left: region.left, top: region.top, width: region.width, height: region.height })
    .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true });
  if (mark) {
    const factor = Math.min(1, size / Math.max(region.width, region.height));
    const width = Math.max(1, Math.round(region.width * factor)), height = Math.max(1, Math.round(region.height * factor));
    const [x, y, w, h] = region.targetBox;
    image = image.composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="${x * width}" y="${y * height}" width="${w * width}" height="${h * height}" fill="none" stroke="white" stroke-width="1.5"/></svg>`) }]);
  }
  const raw = await image.png().toBuffer();
  for (const quality of [85, 75, 65, 50]) {
    const bytes = await sharp(raw).jpeg({ quality }).toBuffer();
    if (bytes.length <= limit) return `data:image/jpeg;base64,${bytes.toString('base64')}`;
  }
  throw new Error('Evidence cannot fit the image budget.');
}

export async function plantEvidence(source, box, { context = true } = {}) {
  const meta = await sharp(source).metadata();
  const region = evidenceRegion(box, meta.width, meta.height);
  const image = await encode(source, region, 360, 100_000);
  if (!context) return { image };
  const expanded = evidenceRegion(box, meta.width, meta.height, true);
  return { image, contextImage: await encode(source, expanded, 512, 200_000, true), contextBox: expanded.targetBox };
}

export async function cropReference(source, box) {
  const meta = await sharp(source).metadata();
  return encode(source, evidenceRegion(box, meta.width, meta.height), 384, 100_000);
}
