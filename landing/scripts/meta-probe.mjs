import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { ApiError, validatePayload } from '../lib/meta-api.js';
import { analyzeRobotFrame, MAX_FRAME_PLANTS } from '../lib/robot-analysis.js';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const models = ['sam-3.1', 'muse-spark-1.3'];
const maxSourceBytes = 20_000_000;
const evaluationScope = 'One-frame integration check; not held-out accuracy, tracking, GPS or field validation.';

export async function prepareProbe(file, crop) {
  if (!file || typeof crop !== 'string' || !/^[a-zA-Z -]{2,40}$/.test(crop)) throw new Error('Provide an image and the known planted crop using --crop.');
  const sourceStat = await stat(file);
  if (!sourceStat.isFile() || sourceStat.size > maxSourceBytes) throw new Error('Use a local image file smaller than 20 MB.');
  const source = await readFile(file);
  if (source.length > maxSourceBytes) throw new Error('Use a local image file smaller than 20 MB.');
  const { data, info } = await sharp(source, { limitInputPixels: 30_000_000, failOn: 'warning' })
    .rotate().flatten({ background: '#ffffff' })
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true });
  const input = {
    image: `data:image/jpeg;base64,${data.toString('base64')}`,
    width: info.width, height: info.height, crop,
    frame_id: `probe-${randomUUID()}`, device_id: 'local-validation',
  };
  validatePayload({ ...input, action: 'segment' });
  return { input, jpeg: data, source: { file_name: basename(file), sha256: sha256(source) }, uploadSha256: sha256(data) };
}

async function drawCandidates(jpeg, result) {
  const { width, height } = result.image;
  const colors = { crop: '#afc3a4', weed: '#ef987f', uncertain: '#edcc79' };
  const boxes = result.plants.map(plant => {
    const [x, y, w, h] = plant.box;
    const color = colors[plant.label];
    return `<g fill="none" stroke="${color}" stroke-width="2"><rect x="${x * width}" y="${y * height}" width="${w * width}" height="${h * height}"/><text x="${x * width}" y="${Math.max(14, y * height - 4)}" fill="${color}" stroke="#101512" stroke-width="3" paint-order="stroke" font-family="sans-serif" font-size="13">${plant.id} ${plant.label}</text></g>`;
  }).join('');
  return sharp(jpeg).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${boxes}</svg>`) }]).png().toBuffer();
}

// Preflight is deliberately the default, even when a provider key is present.
// This local runner reuses the production adapter, but bypasses HTTP/MCP auth.
export async function runProbe({ file, crop, out, live = false, env = process.env, fetcher = fetch, signal } = {}) {
  if (live && !env.MODEL_API_KEY) throw new Error('Live mode requires server-only MODEL_API_KEY. Preflight needs no key.');
  const prepared = await prepareProbe(file, crop);
  const directory = out ? resolve(out) : await mkdtemp(join(tmpdir(), 'greenpoint-meta-probe-'));
  if (out) await mkdir(directory, { mode: 0o700 });
  const report = {
    schema_version: '1.0', run_id: prepared.input.frame_id, created_at: new Date().toISOString(),
    mode: live ? 'live_meta_probe' : 'preflight_only', status: live ? 'running' : 'prepared',
    evaluation_scope: evaluationScope,
    source: prepared.source,
    upload: { file: 'input.jpg', sha256: prepared.uploadSha256, width: prepared.input.width, height: prepared.input.height, bytes: prepared.jpeg.length, crop },
    planned_models: models,
    request_limit: { segmentation: 1, classification: Math.ceil(MAX_FRAME_PLANTS / 8), total: 1 + Math.ceil(MAX_FRAME_PLANTS / 8), retries: 0 },
    readiness: { provider_key_present: Boolean(env.MODEL_API_KEY), credit_balance_verified: false },
    api_requests_attempted: 0, api_cost_usd: live ? null : 0, verified_models: [], requests: [],
    requires_human_review: true, treatment_authorized: false, confidence_calibrated: false,
  };
  const save = () => writeFile(join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  await writeFile(join(directory, 'input.jpg'), prepared.jpeg, { mode: 0o600 });
  await save();
  if (!live) return { directory, report };

  const trackedFetch = async (url, options) => {
    if (report.api_requests_attempted >= report.request_limit.total) throw new Error('Probe request limit reached.');
    const request = { model: JSON.parse(options.body).model, endpoint: new URL(url).pathname };
    report.requests.push(request);
    report.api_requests_attempted++;
    // Persist the attempt before transmission so an interrupted run cannot
    // leave a preflight-looking report with a misleading zero call count.
    await save();
    const started = performance.now();
    try {
      const response = await fetcher(url, options);
      request.http_status = response.status;
      return response;
    } finally { request.headers_elapsed_ms = Math.round(performance.now() - started); }
  };
  const started = performance.now();
  try {
    const result = await analyzeRobotFrame(prepared.input, env, trackedFetch,
      signal ? AbortSignal.any([signal, AbortSignal.timeout(110_000)]) : AbortSignal.timeout(110_000));
    report.result = result;
    // These are validated adapter results, not merely HTTP 200 responses.
    report.verified_models = [models[0], ...(result.plants.some(p => p.original_label !== null) ? [models[1]] : [])];
    report.status = result.status === 'partial' ? 'partial' : result.candidate_count ? 'completed' : 'no_candidates';
    report.overlay = { file: 'candidates.png', kind: 'candidate_boxes_not_pixel_masks', human_reviewed: false };
    await writeFile(join(directory, 'candidates.png'), await drawCandidates(prepared.jpeg, result), { mode: 0o600 });
  } catch (error) {
    report.status = 'failed';
    report.error = {
      code: error instanceof ApiError ? error.code : signal?.aborted ? 'analysis_canceled' : 'probe_failed',
      message: error instanceof ApiError ? error.message : 'Probe did not finish. Inspect configuration and rerun explicitly; no automatic retry was made.',
    };
  } finally {
    report.elapsed_seconds = Math.round((performance.now() - started) * 1000) / 1_000_000;
    await save();
  }
  return { directory, report };
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    crop: { type: 'string' }, out: { type: 'string' }, live: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
  } });
  if (values.help || positionals.length !== 1) {
    console.log('Usage: npm run meta:probe -- /absolute/path/field.png --crop "Sugar beet" [--out /new/output/directory] [--live]\nDefault: local preflight, zero API calls. --live sends the image and plant crops to Meta and may incur charges.');
    if (!values.help) process.exitCode = 1;
    return;
  }
  const { directory, report } = await runProbe({ file: positionals[0], crop: values.crop, out: values.out, live: values.live });
  console.log(JSON.stringify({ status: report.status, mode: report.mode, api_requests_attempted: report.api_requests_attempted, verified_models: report.verified_models, output: directory }, null, 2));
  if (!['prepared', 'completed'].includes(report.status)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const message = String(error.message);
    console.error(process.env.MODEL_API_KEY ? message.replaceAll(process.env.MODEL_API_KEY, '[redacted]') : message);
    process.exitCode = 1;
  });
}
