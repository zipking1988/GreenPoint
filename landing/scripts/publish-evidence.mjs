// Publish frozen, credential-free evidence only. Never invokes a model.
import { readFile, writeFile, mkdir, stat, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve('../reviews/hackathon-sprint-2026-11-03');
const output = resolve('public/assets/verified-run');
await mkdir(output, { recursive: true });
const json = async file => JSON.parse(await readFile(join(root, file), 'utf8'));
const manifest = await json('manifest.json'), development = await json('development-metrics.json'), evaluation = await json('evaluation-metrics.json'), selection = await json('selection.json');
const budget = await json('budget.json');
const results = [];
for (const item of manifest.items.filter(i => i.purpose === 'evaluation')) results.push(await json(`results/evaluation/${selection.selected}/${item.id}.json`));
const weedExample = results.find(r => r.plants.some(p => p.label === 'weed')) ?? results[0];
const exampleIds = [...new Set([weedExample.image_id, results[0].image_id])];
const sessions = [];
for (const imageId of exampleIds) {
  const item = manifest.items.find(i => i.id === imageId), run = results.find(r => r.image_id === imageId);
  const bytes = await sharp(join(root, item.files.images.path)).rotate().jpeg({ quality: 80 }).toBuffer();
  const name = imageId.replace('.png', '.jpg');
  await writeFile(join(output, name), bytes);
  const segmented = await json(`segments/${imageId}.json`);
  const log = [{ stage: 'segment', status: 'completed', elapsed_ms: segmented.elapsed_ms, usage: segmented.usage }];
  for (let i = 0; i < Math.ceil(run.plants.length / 4); i++) {
    const batch = await json(`classifications/evaluation/${selection.selected}/${imageId}-${i}.json`);
    log.push({ stage: 'classify', status: batch.error_code ? 'failed' : 'completed', error_code: batch.error_code, elapsed_ms: batch.elapsed_ms, usage: batch.usage });
    if (batch.error_code) break;
  }
  const recordedAt = (await stat(join(root, `results/evaluation/${selection.selected}/${imageId}.json`))).mtime.toISOString();
  const image = `/assets/verified-run/${name}`;
  sessions.push({ id: `recorded-${imageId}`, runId: `frozen-${createHash('sha256').update(JSON.stringify(run)).digest('hex').slice(0, 16)}`, name: imageId === weedExample.image_id ? 'Sugar beet / Weed review example' : 'Sugar beet / First evaluation frame', fileName: imageId, crop: 'Sugar beet', mode: run.limited ? 'partial' : 'live', duration: 0, width: 1024, height: 1024, video: null, image, frames: [{ time: 0, image }], plants: run.plants.map(p => ({ ...p, source: 'sam-3.1 + muse-spark-1.3', reviewed: false, reviewStatus: 'pending', bestFrame: 0, observations: [{ frame: 0, time: 0, box: p.box, mask: p.mask }] })), identityMethod: 'single_frame', completedFrames: 1, limited: run.limited, analysisLog: log, elapsed: Math.round(log.reduce((n, e) => n + (e.elapsed_ms ?? 0), 0) / 1000), classificationStrategy: selection.selected, createdAt: recordedAt, dirty: false, provenance: { recorded: true, recordedAt, source: 'PhenoBench UAV RGB / Sugar beet', sourceUrl: 'https://www.phenobench.org/dataset.html', sourceImageId: imageId, originalSha256: item.files.images.sha256, preparedImageSha256: createHash('sha256').update(bytes).digest('hex'), license: 'CC BY-SA 4.0', models: ['sam-3.1', 'muse-spark-1.3'], identityScope: 'this_image_only', demonstrationSelection: imageId === weedExample.image_id ? 'First frozen evaluation image with a model weed prediction; all 20 images remain in the report.' : 'First frozen evaluation image.', trackingGroundTruth: false } });
}
const native = await json('native/evaluation/session.json');
sessions.push(native);
await writeFile(join(output, 'index.json'), JSON.stringify({ defaultId: sessions[0].id, sessions }) + '\n');
await writeFile(join(output, 'session.json'), JSON.stringify(sessions[0]) + '\n');
const truth = await json('truth.json');
const clean = run => ({ ...run, plants: run.plants.map(({ mask, ...plant }) => plant), groundTruth: truth[run.image_id] });
const summary = { date: '2026-11-03', scope: '25 frozen PhenoBench images: 5 development, 20 official validation. Public dataset only; no farm-level generalization claim.', selected: selection.selected, development, evaluation, targets: { weed_precision: 0.9, weed_recall: 0.6, crop_as_weed_rate_max: 0.05 }, status: 'Assisted-review prototype. Weed recognition target not met.', nativeVideo: { clips: 2, secondsPerClip: 4, candidates: 0, trackedIdentitiesValidated: false, source: 'Bonn Sugar Beets 2016 / BoniRob RGB' }, costs: { currency: 'USD', heldOrEstimated: budget.entries.reduce((n, e) => n + (e.actual_usd ?? e.reserved_usd), 0), reconciledBill: false, entries: budget.entries.length, experimentLimit: 10 }, limitations: ['Only three positive weed predictions in evaluation; precision is not a robust generalization estimate.', 'Missed and uncertain plants stay in the recall denominator.', 'Axis-aligned boxes matched greedily one-to-one at IoU 0.5; partial border instances included.', 'UAV public images are not evidence of Japanese phone-camera or real-farmer performance.', 'No crop reference is enabled by default; development reference comparison increased crop-as-weed errors.', 'Native video completed with zero candidates; no successful movement identity validation is claimed.', 'No GPS, metric area, treatment, hardware actuation, time savings or pesticide reduction measured.'] };
await writeFile(resolve('public/validation-summary.json'), JSON.stringify(summary, null, 2) + '\n');
await copyFile(join(root, 'manifest.json'), resolve('public/assets/verified-run/manifest.json'));
await writeFile(join(output, 'benchmark.json'), JSON.stringify({ summary, selection, results: results.map(clean) }, null, 2) + '\n');
console.log(JSON.stringify({ publishedSessions: sessions.length, exampleImages: exampleIds, summary: summary.status }));
