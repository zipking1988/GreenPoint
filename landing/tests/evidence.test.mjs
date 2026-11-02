import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { evidenceRegion, classificationBatches, observedPlants } from '../src/dashboard/evidence.js';
import { plantEvidence } from '../lib/plant-evidence.js';
import { inspectMp4 } from '../lib/mp4.js';
import { analyze, validatePayload } from '../lib/meta-api.js';
import { nativeTracks } from '../src/dashboard/tracker.js';
import { ExperimentBudget } from '../scripts/budget.mjs';
import { runPerceptionAgent } from '../lib/agent-loop.js';
import { analyzeRobotFrame } from '../lib/robot-analysis.js';
import { csvText } from '../src/dashboard/data.js';

const box = (type, data) => { const head = Buffer.alloc(8); head.writeUInt32BE(8 + data.length); head.write(type, 4); return Buffer.concat([head, data]); };
function movie({ seconds = 1, rotation = false } = {}) {
  const header = Buffer.alloc(100); header.writeUInt32BE(1000, 12); header.writeUInt32BE(seconds * 1000, 16);
  const track = Buffer.alloc(84); [65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824].forEach((v, i) => track.writeUInt32BE(rotation && !i ? 0 : v, 40 + i * 4)); track.writeUInt32BE(100 * 65536, 76); track.writeUInt32BE(100 * 65536, 80);
  const handler = Buffer.alloc(12); handler.write('vide', 8);
  const stsd = Buffer.alloc(44); stsd.writeUInt32BE(1, 4); stsd.write('avc1', 12); stsd.writeUInt16BE(100, 40); stsd.writeUInt16BE(100, 42);
  const stts = Buffer.alloc(16); stts.writeUInt32BE(1, 4); stts.writeUInt32BE(seconds * 10, 8); stts.writeUInt32BE(100, 12);
  return Buffer.concat([box('ftyp', Buffer.alloc(8)), box('moov', Buffer.concat([box('mvhd', header), box('trak', Buffer.concat([box('tkhd', track), box('mdia', Buffer.concat([box('hdlr', handler), box('mdhd', header), box('minf', box('stbl', Buffer.concat([box('stsd', stsd), box('stts', stts)])))]))]))])), box('mdat', Buffer.alloc(16))]);
}

test('same-source evidence geometry stays inside edge frames and JPEG byte caps', async () => {
  const region = evidenceRegion([0.94, 0.91, 0.06, 0.09], 600, 400, true);
  assert.ok(region.left >= 0 && region.left + region.width <= 600);
  assert.ok(region.targetBox[0] + region.targetBox[2] <= 1.000001);
  assert.ok(region.targetBox[1] + region.targetBox[3] <= 1.000001);
  const source = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#567845' } }).jpeg().toBuffer();
  const evidence = await plantEvidence(source, [0.94, 0.91, 0.06, 0.09]);
  assert.deepEqual(evidence.contextBox, region.targetBox);
  assert.ok(Buffer.from(evidence.image.split(',')[1], 'base64').length <= 100_000);
  assert.ok(Buffer.from(evidence.contextImage.split(',')[1], 'base64').length <= 200_000);
  const validated = validatePayload({ action: 'classify', crop: 'Sugar beet', referenceImage: evidence.image, plants: [{ id: 'GP-001', ...evidence }] });
  assert.equal(validated.referenceImage, evidence.image);
  assert.throws(() => validatePayload({ ...validated, plants: [{ ...validated.plants[0], contextBox: [0.9, 0, 0.5, 1] }] }));
});

test('classification batches bound full evidence including reference and preserve all IDs', () => {
  const plants = Array.from({ length: 9 }, (_, i) => ({ id: `GP-${i}`, image: 'x'.repeat(600_000) }));
  const batches = classificationBatches(plants, 'y'.repeat(200_000));
  assert.deepEqual(batches.map(b => b.length), [3, 3, 3]);
  assert.equal(batches.flat().length, plants.length);
  assert.throws(() => classificationBatches([{ image: 'x'.repeat(2_600_000) }]));
});

test('native media limits reject rotated, oversized, overlong and truncated MP4 before a provider call', () => {
  assert.deepEqual(inspectMp4(movie()), { width: 100, height: 100, fps: 10, frameCount: 10, duration: 1 });
  for (const bytes of [movie({ seconds: 7 }), movie({ rotation: true }), Buffer.alloc(2_000_001), movie().subarray(0, 80)]) assert.throws(() => validatePayload({ action: 'segment_video', video: `data:video/mp4;base64,${bytes.toString('base64')}` }));
  assert.throws(() => validatePayload({ action: 'segment_video', video: 'https://example.com/video.mp4' }));
});

test('native stream reorders source frames and links only matching provider IDs', async () => {
  const record = "0<|box;x1=10;y1=20;x2=69;y2=46;w=100;h=100;c=0.92|><|mask;x=0;y=0;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7`e.ioeAf6-k/#Xd8%dX9x(|>";
  const text = `<5f>${record}\n<0f>${record}`;
  const events = [{ type: 'response.output_text.delta', item_id: 'lane', output_index: 0, content_index: 0, delta: text }, { type: 'response.output_text.done', item_id: 'lane', output_index: 0, content_index: 0, text }, { type: 'response.completed' }];
  const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(events.map(e => `data: ${JSON.stringify(e)}\n\n`).join(''))); c.close(); } });
  const result = await analyze(validatePayload({ action: 'segment_video', video: `data:video/mp4;base64,${movie().toString('base64')}` }), { MODEL_API_KEY: 'test' }, async (_, options) => {
    assert.equal(JSON.parse(options.body).input[0].content[1].type, 'input_video');
    return { ok: true, body: stream };
  });
  assert.deepEqual(result.frames.map(f => f.frameIndex), [0, 5]);
  const tracks = nativeTracks(result.frames);
  assert.equal(tracks.length, 1); assert.equal(tracks[0].observations.length, 2);
  const session = { plants: tracks };
  assert.equal(observedPlants(session, 0)[0].sourceFrame, 0);
  assert.equal(observedPlants(session, 2).length, 0);
  const absentMask = { plants: [{ ...tracks[0], mask: { wrong: 'best frame' }, observations: [{ frame: 0, box: tracks[0].box }] }] };
  assert.equal(observedPlants(absentMask, 0)[0].mask, null);
});

test('invalid MCP crop reference is rejected before any provider billing', async () => {
  const image = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#567845' } }).jpeg().toBuffer();
  await assert.rejects(analyzeRobotFrame({ image: `data:image/jpeg;base64,${image.toString('base64')}`, width: 100, height: 100, crop: 'Sugar beet', crop_reference: 'data:image/jpeg;base64,/9j/AAAA' }, { MODEL_API_KEY: 'test' }, async () => assert.fail('invalid reference reached provider')), error => error.code === 'invalid_reference');
});

test('empty recorded run export retains source attribution and identity method', () => {
  const csv = csvText({ id: 'native-recording', runId: 'recorded-id', mode: 'live', plants: [], identityMethod: 'sam_video', provenance: { recorded: true, source: 'Bonn', clipSha256: 'source-hash' } });
  assert.match(csv, /"run_summary","sam_video","","","true"/);
  assert.match(csv, /source-hash/);
});

test('unknown billing holds its reservation and budget exhaustion prevents another experiment', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gp-budget-'));
  try {
    const budget = new ExperimentBudget(join(dir, 'budget.json'), 0.2);
    const first = await budget.reserve('unknown', 0.1); await budget.settle(first, null);
    const second = await budget.reserve('known', 0.1); await budget.settle(second, { estimatedUsd: 0.02 });
    await assert.rejects(budget.reserve('blocked', 0.1), /budget reached/);
    assert.equal((await budget.read()).entries.length, 2);
    await assert.rejects(budget.reserve('invalid', -1));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('agent really requests MCP evidence, respects frame handles and cannot claim empty on partial coverage', async () => {
  const frameId = 'frame-1'; let turn = 0;
  const reply = message => ({ choices: [{ message, finish_reason: 'stop' }] });
  const tool = (id, name, args) => ({ id, type: 'function', function: { name, arguments: JSON.stringify(args) } });
  const chat = async () => ++turn === 1 ? reply({ role: 'assistant', tool_calls: [tool('a', 'greenpoint_capabilities', {}), tool('b', 'greenpoint_analyze_frame', { frame_id: frameId })] }) : reply({ role: 'assistant', content: JSON.stringify({ decision: 'no_candidates', reasoning: 'No candidate plants were returned, without proving weed-free ground.', evidence_ids: [] }) });
  const output = await runPerceptionAgent({ frameId, chat, callTool: async name => name === 'greenpoint_capabilities' ? { image_coordinates_only: true } : { status: 'completed', limited: false, plants: [] } });
  assert.equal(output.trace.length, 2); assert.equal(output.treatment_authorized, false);
  turn = 0;
  await assert.rejects(runPerceptionAgent({ frameId, chat, callTool: async name => name === 'greenpoint_capabilities' ? {} : { status: 'partial', limited: true, plants: [] } }), /does not support/);
  await assert.rejects(runPerceptionAgent({ frameId, chat: async () => reply({ tool_calls: [tool('x', 'fly_to_plant', {})] }), callTool: async () => assert.fail('forbidden tool executed') }), /forbidden/);
});
