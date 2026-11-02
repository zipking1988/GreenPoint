import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { analyze, validatePayload } from '../lib/meta-api.js';
import { plantEvidence, cropReference } from '../lib/plant-evidence.js';
import { classificationBatches } from '../src/dashboard/evidence.js';
import { ExperimentBudget } from './budget.mjs';

const { values } = parseArgs({ options: { root: { type: 'string', default: '../reviews/hackathon-sprint-2026-11-03' }, phase: { type: 'string', default: 'development' }, live: { type: 'boolean', default: false } } });
const root = resolve(values.root);
if (!values.live || !process.env.MODEL_API_KEY) throw new Error('Benchmark requires explicit --live and a server-only key.');
if (!['development', 'evaluation'].includes(values.phase)) throw new Error('Choose development or evaluation.');
const json = async file => JSON.parse(await readFile(join(root, file), 'utf8'));
const manifest = await json('manifest.json');
const truth = await json('truth.json');
const reference = await json('reference.json');
const anchorItem = manifest.items.find(item => item.id === reference.source_id && item.purpose === 'development');
if (!anchorItem) throw new Error('Crop reference must come from the frozen development set.');
const referenceImage = await cropReference(await readFile(join(root, anchorItem.files.images.path)), reference.box);
const budget = new ExperimentBudget(join(root, 'budget.json'));
const configs = values.phase === 'development' ? ['baseline', 'context', 'reference'] : ['baseline', (await json('selection.json')).selected];

async function cached(file, create) {
  try { return await json(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const result = await create();
  await mkdir(join(root, file, '..'), { recursive: true });
  await writeFile(join(root, file), JSON.stringify(result, null, 2) + '\n');
  return result;
}

async function paid(payload, label) {
  const reservation = await budget.reserve(label, payload.action === 'segment' ? 0.0025 : 0.10);
  const started = performance.now();
  try {
    const result = await analyze(validatePayload(payload));
    await budget.settle(reservation, result.usage);
    return { ...result, elapsed_ms: Math.round(performance.now() - started) };
  } catch (error) {
    // Frozen evaluation includes failures. Never retry until an image yields
    // the desired answer or silently remove it from the denominator.
    return { ...(payload.action === 'segment' ? { detections: [], limited: true } : { plants: [] }), error_code: error.code || 'request_failed', elapsed_ms: Math.round(performance.now() - started), usage: null };
  }
}

function iou(a, b) {
  const area = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  return area / (a[2] * a[3] + b[2] * b[3] - area);
}

function metrics(runs) {
  let gtWeed = 0, gtCrop = 0, predictedWeed = 0, weedTp = 0, cropAsWeed = 0, uncertain = 0, detections = 0, matchedCount = 0, totalTruth = 0;
  for (const run of runs) {
    const actual = truth[run.image_id].plants;
    gtWeed += actual.filter(p => p.label === 'weed').length;
    gtCrop += actual.filter(p => p.label === 'crop').length;
    totalTruth += actual.length;
    const pairs = run.plants.flatMap((p, pi) => actual.map((g, gi) => ({ pi, gi, iou: iou(p.box, g.box) }))).filter(p => p.iou >= 0.5).sort((a, b) => b.iou - a.iou);
    const usedPred = new Set(), usedGt = new Set(), matches = new Map();
    for (const pair of pairs) if (!usedPred.has(pair.pi) && !usedGt.has(pair.gi)) { usedPred.add(pair.pi); usedGt.add(pair.gi); matches.set(pair.pi, actual[pair.gi]); matchedCount++; }
    run.plants.forEach((p, index) => {
      detections++;
      uncertain += Number(p.label === 'uncertain');
      if (p.label === 'weed') {
        predictedWeed++;
        weedTp += Number(matches.get(index)?.label === 'weed');
        cropAsWeed += Number(matches.get(index)?.label === 'crop');
      }
    });
  }
  const precision = predictedWeed ? weedTp / predictedWeed : 0, recall = gtWeed ? weedTp / gtWeed : 0;
  return { images: runs.length, ground_truth_plants: totalTruth, ground_truth_weed: gtWeed, ground_truth_crop: gtCrop, detected_candidates: detections, weed_predictions: predictedWeed, weed_true_positives: weedTp, weed_precision: precision, weed_recall: recall, weed_f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0, crop_as_weed_rate: gtCrop ? cropAsWeed / gtCrop : 0, uncertain_rate: detections ? uncertain / detections : 0, detection_recall_iou50: totalTruth ? matchedCount / totalTruth : 0, partial_images: runs.filter(r => r.limited).length, target_gates_passed: precision >= 0.9 && recall >= 0.6 && (gtCrop ? cropAsWeed / gtCrop : 0) <= 0.05 };
}

const aggregates = {};
for (const config of [...new Set(configs)]) {
  const runs = [];
  for (const item of manifest.items.filter(i => i.purpose === values.phase)) {
    const run = await cached(`results/${values.phase}/${config}/${item.id}.json`, async () => {
      const { data: bytes, info } = await sharp(join(root, item.files.images.path)).rotate().jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true });
      const segmentation = await cached(`segments/${item.id}.json`, () => paid({ action: 'segment', image: `data:image/jpeg;base64,${bytes.toString('base64')}`, width: info.width, height: info.height }, `segment:${item.id}`));
      const plants = segmentation.detections.map((p, i) => ({ id: `GP-${String(i + 1).padStart(3, '0')}`, box: p.box, mask: p.mask, label: 'uncertain', originalLabel: null }));
      const evidence = await Promise.all(plants.map(async p => ({ id: p.id, ...await plantEvidence(bytes, p.box, { context: config !== 'baseline' }) })));
      const usages = [segmentation.usage];
      const errors = segmentation.error_code ? [segmentation.error_code] : [];
      const batches = classificationBatches(evidence, config === 'reference' ? referenceImage : undefined);
      for (let index = 0; index < batches.length; index++) {
        const batch = batches[index];
        const classified = await cached(`classifications/${values.phase}/${config}/${item.id}-${index}.json`, () => paid({ action: 'classify', crop: 'Sugar beet', plants: batch, ...(config === 'reference' ? { referenceImage } : {}) }, `${config}:${item.id}:${index}`));
        usages.push(classified.usage);
        if (classified.error_code) { errors.push(classified.error_code); break; }
        classified.plants.forEach(value => Object.assign(plants.find(p => p.id === value.id), value));
      }
      return { image_id: item.id, config, limited: segmentation.limited || errors.length > 0, errors, plants, usages, reference_id: config === 'reference' ? reference.source_id : null };
    });
    runs.push(run);
    console.log(JSON.stringify({ phase: values.phase, config, image: item.id, labels: run.plants.reduce((s, p) => (s[p.label] = (s[p.label] || 0) + 1, s), {}) }));
  }
  aggregates[config] = metrics(runs);
}
await writeFile(join(root, `${values.phase}-metrics.json`), JSON.stringify(aggregates, null, 2) + '\n');
if (values.phase === 'development') {
  const ranked = Object.entries(aggregates).sort((a, b) => {
    const score = value => value.weed_f1 - value.crop_as_weed_rate * 2;
    return score(b[1]) - score(a[1]) || b[1].weed_precision - a[1].weed_precision || ['baseline', 'context', 'reference'].indexOf(a[0]) - ['baseline', 'context', 'reference'].indexOf(b[0]);
  });
  await writeFile(join(root, 'selection.json'), JSON.stringify({ selected: ranked[0][0], criterion: 'development weed F1 minus 2*crop-as-weed rate; ties precision, then simpler strategy; frozen before evaluation', aggregates }, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify(aggregates, null, 2));
