import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { runProbe } from '../scripts/meta-probe.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'greenpoint-meta-probe-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = join(root, 'field.png');
  await sharp({ create: { width: 100, height: 100, channels: 3, background: '#63992f' } }).png().toFile(file);
  return { file, out: join(root, 'run'), crop: 'Sugar beet' };
}

const env = { MODEL_API_KEY: 'private-test-provider-key' };
const noNetwork = () => { throw new Error('Preflight must not access the network.'); };
// Controlled official-format SAM transport fixture, not field/model evidence.
const detection = '<0f>0<|box;x1=10;y1=20;x2=69;y2=46;w=100;h=100;c=0.92|>' + "<|mask;x=0;y=0;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7`e.ioeAf6-k/#Xd8%dX9x(|>";
function segmentResponse(text = detection) {
  const lane = { item_id: 'frame', output_index: 0, content_index: 0 };
  const events = [{ type: 'response.output_text.delta', ...lane, delta: text }, { type: 'response.output_text.done', ...lane, text }, { type: 'response.completed' }];
  return new Response(events.map(e => `data: ${JSON.stringify(e)}\n\n`).join(''));
}

test('default preflight never calls models, even with a key; persists the exact prepared image without credentials', async t => {
  const config = await fixture(t);
  const { directory, report } = await runProbe({ ...config, env, fetcher: noNetwork });
  assert.equal(report.mode, 'preflight_only');
  assert.equal(report.status, 'prepared');
  assert.equal(report.api_requests_attempted, 0);
  assert.deepEqual(report.verified_models, []);
  assert.equal(report.api_cost_usd, 0);
  assert.equal(report.readiness.credit_balance_verified, false);
  assert.equal(report.requires_human_review, true);
  assert.equal(report.treatment_authorized, false);
  const saved = await readFile(join(directory, 'report.json'), 'utf8');
  assert.ok(!saved.includes(env.MODEL_API_KEY));
  assert.equal((await sharp(join(directory, 'input.jpg')).metadata()).format, 'jpeg');
  assert.equal(report.upload.crop, 'Sugar beet');
  await assert.rejects(runProbe({ ...config, env, fetcher: noNetwork }), { code: 'EEXIST' });
});

test('missing key, unknown crop context, malformed images and tiny images cannot reach Meta', async t => {
  const config = await fixture(t);
  await assert.rejects(runProbe({ ...config, live: true, env: {}, fetcher: noNetwork }), /MODEL_API_KEY/);
  await assert.rejects(runProbe({ ...config, crop: undefined, live: true, env, fetcher: noNetwork }), /known planted crop/);
  await writeFile(config.file, 'not an image');
  await assert.rejects(runProbe({ ...config, live: true, env, fetcher: noNetwork }));
  await sharp({ create: { width: 10, height: 10, channels: 3, background: '#63992f' } }).png().toFile(config.file);
  await assert.rejects(runProbe({ ...config, live: true, env, fetcher: noNetwork }), /32 and 1280/);
});

test('live probe reuses segmentation and same-frame crops; records only validated model output', async t => {
  const config = await fixture(t);
  const bodies = [];
  const fetcher = async (url, options) => {
    assert.equal(options.headers.Authorization, `Bearer ${env.MODEL_API_KEY}`);
    const body = JSON.parse(options.body); bodies.push(body);
    if (url.endsWith('/responses')) return segmentResponse();
    assert.ok(body.messages[0].content.includes('Sugar beet'));
    const cropImage = body.messages[1].content[1].image_url.url;
    const crop = await sharp(Buffer.from(cropImage.split(',')[1], 'base64')).metadata();
    assert.ok(crop.width < 100 && crop.height < 100);
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ plants: [{ id: 'GP-001', label: 'weed', confidence: 0.65, reasoning: 'Broad leaves differ from the planted crop.' }] }) } }] });
  };
  const { directory, report } = await runProbe({ ...config, live: true, env, fetcher });
  assert.equal(bodies.length, 2);
  assert.equal(report.status, 'completed');
  assert.deepEqual(report.verified_models, ['sam-3.1', 'muse-spark-1.3']);
  assert.equal(report.api_requests_attempted, 2);
  assert.equal(report.api_cost_usd, null, 'Do not invent cost or credit balance.');
  assert.equal(report.result.plants[0].label, 'uncertain');
  assert.equal(report.result.plants[0].original_label, 'weed');
  assert.equal(report.result.plants[0].reviewed, false);
  assert.equal(report.overlay.kind, 'candidate_boxes_not_pixel_masks');
  const submitted = bodies[0].input[0].content[1].image_url;
  assert.equal(submitted, `data:image/jpeg;base64,${(await readFile(join(directory, 'input.jpg'))).toString('base64')}`);
  assert.equal((await sharp(join(directory, 'candidates.png')).metadata()).width, 100);
  assert.ok(!(await readFile(join(directory, 'report.json'), 'utf8')).includes(env.MODEL_API_KEY));
});

test('a classifier HTTP 200 with invalid output stays partial and does not verify Muse Spark', async t => {
  const config = await fixture(t);
  const { report } = await runProbe({ ...config, live: true, env, fetcher: async url => url.endsWith('/responses') ? segmentResponse() : Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{}' } }] }) });
  assert.equal(report.status, 'partial');
  assert.deepEqual(report.verified_models, ['sam-3.1']);
  assert.equal(report.result.error_code, 'invalid_classification');
  assert.equal(report.result.plants[0].original_label, null);
  assert.equal(report.api_requests_attempted, 2);
});

test('provider rejection is saved as a failed run, without a retry or fabricated detections', async t => {
  const config = await fixture(t);
  const { report } = await runProbe({ ...config, live: true, env, fetcher: async () => new Response('denied', { status: 401 }) });
  assert.equal(report.status, 'failed');
  assert.equal(report.error.code, 'provider_auth');
  assert.equal(report.api_requests_attempted, 1);
  assert.equal(report.requests[0].http_status, 401);
  assert.deepEqual(report.verified_models, []);
  assert.equal(report.result, undefined);
});

test('an empty segmentation does not claim the classifier was exercised', async t => {
  const config = await fixture(t);
  const { report } = await runProbe({ ...config, live: true, env, fetcher: async () => segmentResponse('') });
  assert.equal(report.status, 'no_candidates');
  assert.equal(report.api_requests_attempted, 1);
  assert.deepEqual(report.verified_models, ['sam-3.1']);
  assert.equal(report.result.candidate_count, 0);
});
