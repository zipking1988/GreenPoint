import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { join, resolve } from 'node:path';
import { analyze, validatePayload } from '../lib/meta-api.js';
import { nativeTracks } from '../src/dashboard/tracker.js';
import { classificationBatches } from '../src/dashboard/evidence.js';
import { plantEvidence, cropReference } from '../lib/plant-evidence.js';
import { ExperimentBudget } from './budget.mjs';

const { values } = parseArgs({ options: { phase: { type: 'string', default: 'evaluation' }, live: { type: 'boolean', default: false }, publish: { type: 'boolean', default: false } } });
if (!values.live || !process.env.MODEL_API_KEY || !['development', 'evaluation'].includes(values.phase)) throw new Error('Use --live and a development/evaluation phase with a server-only key.');
const root = resolve('../reviews/hackathon-sprint-2026-11-03');
const json = async name => JSON.parse(await readFile(join(root, name), 'utf8'));
const manifest = await json('manifest.json');
const reference = await json('reference.json');
const selection = await json('selection.json');
const referenceSource = manifest.items.find(i => i.id === reference.source_id && i.purpose === 'development');
if (!referenceSource) throw new Error('Reference must belong to development data.');
const referenceImage = await cropReference(await readFile(join(root, referenceSource.files.images.path)), reference.box);
const clip = join(root, 'video', `${values.phase}-4s.mp4`);
const bytes = await readFile(clip);
const budget = new ExperimentBudget(join(root, 'budget.json'));
const dir = join(root, 'native', values.phase);
await mkdir(dir, { recursive: true });
async function cache(name, run) {
  try { return JSON.parse(await readFile(join(dir, name), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const result = await run(); await writeFile(join(dir, name), JSON.stringify(result, null, 2) + '\n'); return result;
}
async function paid(body, label, usd) {
  const reservation = await budget.reserve(label, usd);
  const start = performance.now();
  const result = await analyze(validatePayload(body));
  await budget.settle(reservation, result.usage);
  return { ...result, elapsed_ms: Math.round(performance.now() - start), recorded_at: new Date().toISOString() };
}
const segmentation = await cache('segment.json', () => paid({ action: 'segment_video', video: `data:video/mp4;base64,${bytes.toString('base64')}` }, `native:${values.phase}`, 0.04));
const tracks = nativeTracks(segmentation.frames);
const frames = [];
for (let i = 0; i < segmentation.frames.length; i++) {
  const frame = segmentation.frames[i];
  const path = join(dir, `frame-${i}.jpg`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', clip, '-ss', String(frame.time), '-frames:v', '1', '-q:v', '3', path]);
  frames.push({ time: frame.time, sourceFrameIndex: frame.frameIndex, path });
}
const strategy = selection.selected;
const anchor = strategy === 'reference' ? referenceImage : undefined;
const evidence = await Promise.all(tracks.map(async p => ({ id: p.id, ...await plantEvidence(await readFile(frames[p.bestFrame].path), p.box, { context: strategy !== 'baseline' }) })));
const batches = classificationBatches(evidence, anchor);
const log = [{ stage: 'segment_video', status: 'completed', elapsed_ms: segmentation.elapsed_ms, usage: segmentation.usage }];
for (let i = 0; i < batches.length; i++) {
  const result = await cache(`classify-${strategy}-${i}.json`, () => paid({ action: 'classify', crop: 'Sugar beet', plants: batches[i], ...(anchor ? { referenceImage: anchor } : {}) }, `native:${values.phase}:classify:${i}`, 0.1));
  result.plants.forEach(value => Object.assign(tracks.find(p => p.id === value.id), value, { source: 'sam-3.1 + muse-spark-1.3' }));
  log.push({ stage: 'classify', index: i + 1, status: 'completed', elapsed_ms: result.elapsed_ms, usage: result.usage });
}
const recordedAt = segmentation.recorded_at;
const session = { id: `recorded-bonn-${values.phase}`, runId: `native-${recordedAt}`, name: 'Sugar beet / Bonn field', crop: 'Sugar beet', mode: 'live', fileName: 'bonn-sugar-beet-real-footage.mp4', video: '/assets/verified-run/clip.mp4', width: segmentation.width, height: segmentation.height, duration: segmentation.duration, frames: frames.map((f, i) => ({ time: f.time, sourceFrameIndex: f.sourceFrameIndex, image: `/assets/verified-run/frame-${i}.jpg` })), image: '/assets/verified-run/frame-0.jpg', plants: tracks, identityMethod: 'sam_video', limited: segmentation.limited, completedFrames: frames.length, elapsed: Math.round(log.reduce((n, e) => n + e.elapsed_ms, 0) / 1000), analysisLog: log, createdAt: recordedAt, dirty: false, cropReference: anchor ? { plantId: 'development-anchor', frame: null, sourceImageId: reference.source_id, box: reference.box, confirmedBy: 'PhenoBench development annotation', image: anchor } : null, classificationStrategy: strategy, provenance: { recorded: true, recordedAt, source: 'Bonn sugar beet dataset / BoniRob RGB camera', sourceUrl: 'https://www.ipb.uni-bonn.de/data/sugarbeets2016/', repositoryCommit: manifest.sources.video_repository_commit, originalVideoSha256: manifest.video.video.sha256, preparedClipSha256: createHash('sha256').update(bytes).digest('hex'), originalSeconds: values.phase === 'evaluation' ? [6, 10] : [0, 4], preparation: '4-second excerpt, 1280×954 H.264 at 10 fps; genuine camera movement, no synthesized frames', license: 'CC BY-SA 4.0', models: tracks.length ? ['sam-3.1', 'muse-spark-1.3'] : ['sam-3.1'], identityScope: 'this_clip_only', trackingGroundTruth: false } };
await writeFile(join(dir, 'session.json'), JSON.stringify(session, null, 2) + '\n');
if (values.publish) {
  const destination = resolve('public/assets/verified-run'); await mkdir(destination, { recursive: true });
  await copyFile(clip, join(destination, 'clip.mp4'));
  for (let i = 0; i < frames.length; i++) await copyFile(frames[i].path, join(destination, `frame-${i}.jpg`));
  await writeFile(join(destination, 'session.json'), JSON.stringify(session) + '\n');
}
console.log(JSON.stringify({ phase: values.phase, strategy, plants: tracks.length, labels: tracks.reduce((counts, p) => (counts[p.label] = (counts[p.label] || 0) + 1, counts), {}), frames: frames.length, limited: session.limited, output: dir }));
