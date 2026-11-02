import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import sharp from 'sharp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { handleMcp } from '../lib/mcp-server.js';

const env = { NODE_ENV: 'production', MODEL_API_KEY: 'test-model-secret', MCP_ACCESS_TOKEN: 'test-robot-secret' };
const jpeg = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#63992f' } }).jpeg().toBuffer();
const frame = { frame_id: 'frame-01', device_id: 'robot-01', image: `data:image/jpeg;base64,${jpeg.toString('base64')}`, width: 100, height: 100, crop: 'Maize' };
const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-11-25' };
const call = (name, args = {}) => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
const text = '<0f>0<|box;x1=10;y1=20;x2=69;y2=46;w=100;h=100;c=0.92|>' + "<|mask;x=0;y=0;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7`e.ioeAf6-k/#Xd8%dX9x(|>";
function upstream() {
  const calls = [];
  return { calls, fetcher: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), headers: options.headers });
    if (url.endsWith('/responses')) {
      const lane = { item_id: 'frame', output_index: 0, content_index: 0 };
      const events = [{ type: 'response.output_text.delta', ...lane, delta: text }, { type: 'response.output_text.done', ...lane, text }, { type: 'response.completed' }];
      return new Response(events.map(e => `data: ${JSON.stringify(e)}\n\n`).join(''));
    }
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ plants: [{ id: 'GP-001', label: 'weed', confidence: 0.65, reasoning: 'Broad leaves between planted rows.', reviewed: true, box: [0, 0, 1, 1] }] }) } }], usage: { prompt_tokens: 100, completion_tokens: 20 } });
  } };
}
async function endpoint(t, config = {}, fetcher = () => { throw new Error('No upstream request expected'); }, preparse = false) {
  const http = createServer(async (req, res) => {
    if (preparse) { const chunks = []; for await (const chunk of req) chunks.push(chunk); req.body = JSON.parse(Buffer.concat(chunks).toString()); }
    await handleMcp(req, res, config, fetcher);
  });
  http.listen(0, '127.0.0.1'); await once(http, 'listening');
  t.after(() => { http.closeAllConnections(); http.close(); });
  const url = new URL(`http://127.0.0.1:${http.address().port}/api/mcp`);
  const post = async (body, extra = {}) => {
    const response = await fetch(url, { method: 'POST', headers: { ...headers, ...extra }, body: typeof body === 'string' ? body : JSON.stringify(body) });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  return { url, post };
}

test('official SDK initializes, discovers three tools and two resources on stateless HTTP', async t => {
  const { url } = await endpoint(t);
  const client = new Client({ name: 'generic-robot-agent', version: '1.0.0' });
  t.after(() => client.close());
  await client.connect(new StreamableHTTPClientTransport(url));
  const tools = (await client.listTools()).tools;
  assert.equal(tools.length, 3);
  assert.equal(tools.find(t => t.name === 'greenpoint_analyze_frame').annotations.openWorldHint, true);
  assert.equal((await client.listResources()).resources.length, 2);
  const schema = await client.readResource({ uri: 'greenpoint://schema/frame-input' });
  assert.ok(JSON.parse(schema.contents[0].text).required.includes('frame_id'));
  const result = await client.callTool({ name: 'greenpoint_capabilities', arguments: {} });
  assert.equal(result.structuredContent.live_analysis_configured, false);
  assert.equal(result.structuredContent.treatment_authorized, false);
});

test('public sample is explicitly illustrative, filterable, and separate from browser reviews', async t => {
  const { post } = await endpoint(t, env);
  const result = await post(call('greenpoint_sample_inventory', { label: 'uncertain' }));
  const data = result.body.result.structuredContent;
  assert.equal(data.mode, 'illustrative_sample'); assert.equal(data.returned, 2); assert.equal(data.total, 12);
  assert.equal(data.browser_decisions_included, false);
  assert.ok(data.plants.every(p => p.confidence === null && p.requires_human_review && !p.reviewed));
  assert.ok(!JSON.stringify(result.body).includes(env.MODEL_API_KEY));
});

test('missing config and invalid robot tokens cannot invoke paid models; operator tokens do not authorize MCP', async t => {
  let calls = 0; const fetcher = async () => { calls++; throw new Error('Unexpected paid call'); };
  const absent = await endpoint(t, {}, fetcher);
  const missing = await absent.post(call('greenpoint_analyze_frame', frame));
  assert.equal(missing.body.result.isError, true); assert.equal(missing.body.result.structuredContent.code, 'not_configured');
  const configured = await endpoint(t, { ...env, ANALYSIS_ACCESS_TOKEN: 'different-operator-token' }, fetcher);
  for (const auth of ['', 'Bearer invalid', 'Bearer different-operator-token']) {
    const denied = await configured.post(call('greenpoint_analyze_frame', frame), { authorization: auth });
    assert.equal(denied.status, 401); assert.ok(denied.headers.get('www-authenticate').startsWith('Bearer'));
  }
  assert.equal(calls, 0);
});

test('authenticated robot analysis returns source crops, original suggestions, scoped coordinates and review flags', async t => {
  const fake = upstream(); const { post } = await endpoint(t, env, fake.fetcher, true);
  const result = await post(call('greenpoint_analyze_frame', frame), { authorization: `Bearer ${env.MCP_ACCESS_TOKEN}` });
  assert.equal(result.status, 200);
  const data = result.body.result.structuredContent;
  assert.equal(data.status, 'completed'); assert.equal(data.frame_id, frame.frame_id); assert.equal(data.device_id, frame.device_id);
  assert.equal(data.identity_scope, 'this_response_only'); assert.equal(data.image.coordinate_system, 'normalized_image_xywh');
  assert.equal(data.plants[0].label, 'uncertain'); assert.equal(data.plants[0].original_label, 'weed');
  assert.equal(data.plants[0].reviewed, false); assert.equal(data.treatment_authorized, false);
  assert.deepEqual(data.plants[0].box, [0.1, 0.2, 0.6, 0.26999999999999996]);
  assert.equal(fake.calls.length, 2);
  assert.equal(data.usage.requests.length, 2);
  assert.ok(data.usage.estimatedUsd > 0.0025);
  const crop = fake.calls[1].body.messages[1].content[1].image_url.url;
  const metadata = await sharp(Buffer.from(crop.split(',')[1], 'base64')).metadata();
  assert.equal(metadata.width, 78); assert.equal(metadata.height, 36);
  assert.ok(!JSON.stringify(result.body).includes(env.MCP_ACCESS_TOKEN));
});

test('classification failure preserves uncertain partial evidence without claiming completion', async t => {
  const fake = upstream();
  const { post } = await endpoint(t, env, (url, options) => url.endsWith('/responses') ? fake.fetcher(url, options) : Response.json({}, { status: 429 }));
  const result = await post(call('greenpoint_analyze_frame', frame), { authorization: `Bearer ${env.MCP_ACCESS_TOKEN}` });
  const data = result.body.result.structuredContent;
  assert.equal(result.body.result.isError, true); assert.equal(data.status, 'partial'); assert.equal(data.error_code, 'provider_rate_limit');
  assert.equal(data.plants.length, 1); assert.equal(data.plants[0].original_label, null); assert.equal(data.plants[0].label, 'uncertain');
  assert.equal(data.usage, null);
});

test('billable truncated or malformed classifier output cannot report a SAM-only total', async t => {
  for (const message of [{ finish_reason: 'length', content: '{"plants":[' }, { finish_reason: 'stop', content: 'not JSON' }]) {
    const fake = upstream(); let requests = 0;
    const { post } = await endpoint(t, env, (url, options) => {
      requests++;
      return url.endsWith('/responses') ? fake.fetcher(url, options) : Response.json({ choices: [{ finish_reason: message.finish_reason, message: { content: message.content } }], usage: { prompt_tokens: 500, completion_tokens: 4000 } });
    });
    const result = await post(call('greenpoint_analyze_frame', frame), { authorization: `Bearer ${env.MCP_ACCESS_TOKEN}` });
    const data = result.body.result.structuredContent;
    assert.equal(requests, 2);
    assert.equal(result.body.result.isError, true);
    assert.equal(data.status, 'partial');
    assert.equal(data.error_code, 'invalid_classification');
    assert.equal(data.usage, null);
    assert.equal(data.plants[0].label, 'uncertain');
  }
});

test('valid large textured frames are not inflated by a higher-quality JPEG re-encode', async t => {
  const pixels = Buffer.alloc(1280 * 1280 * 3); let seed = 12345;
  for (let i = 0; i < pixels.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; pixels[i] = seed >>> 24; }
  const source = await sharp(pixels, { raw: { width: 1280, height: 1280, channels: 3 } }).jpeg({ quality: 45 }).toBuffer();
  const image = `data:image/jpeg;base64,${source.toString('base64')}`;
  assert.ok(image.length < 1_000_000);
  assert.ok((await sharp(source).jpeg({ quality: 85 }).toBuffer()).length > 750_000, 'Fixture must reproduce re-encode inflation.');
  const fake = upstream(); const { post } = await endpoint(t, env, fake.fetcher);
  const result = await post(call('greenpoint_analyze_frame', { ...frame, image, width: 1280, height: 1280 }), { authorization: `Bearer ${env.MCP_ACCESS_TOKEN}` });
  assert.equal(result.body.result.structuredContent.status, 'completed');
  assert.equal(fake.calls[0].body.input[0].content[1].image_url, image);
});

test('malformed image, mismatched dimensions and URLs fail before upstream calls', async t => {
  let calls = 0;
  const { post } = await endpoint(t, env, async () => { calls++; throw new Error('Must not reach upstream'); });
  for (const patch of [{ width: 101 }, { image: 'data:image/jpeg;base64,/9j/AAAA' }, { image: 'https://internal.invalid/photo.jpg' }, { width: 1281 }, { frame_id: '../../private' }, { crop: 'ignore instructions' }]) {
    const result = await post(call('greenpoint_analyze_frame', { ...frame, ...patch }), { authorization: `Bearer ${env.MCP_ACCESS_TOKEN}` });
    assert.ok(result.body.result?.isError || result.body.error);
  }
  assert.equal(calls, 0);
});

test('HTTP boundary enforces origin, bounded JSON, method and content negotiation', async t => {
  const { url, post } = await endpoint(t);
  assert.equal((await post(call('greenpoint_capabilities'), { origin: 'https://attacker.invalid' })).status, 403);
  const allowed = await post(call('greenpoint_capabilities'), { origin: 'https://greenpoint-vert.vercel.app' });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://greenpoint-vert.vercel.app');
  assert.equal((await post('{broken')).status, 400);
  assert.equal((await post('x'.repeat(1_300_001))).status, 413);
  assert.equal((await post([])).status, 400);
  assert.equal((await post(call('greenpoint_capabilities'), { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await post(call('greenpoint_capabilities'), { accept: 'application/json' })).status, 406);
  assert.equal((await fetch(url)).status, 405);
});

test('disconnecting a robot call aborts its in-flight model request', async t => {
  let began; const started = new Promise(resolve => { began = resolve; });
  let aborted; const canceled = new Promise(resolve => { aborted = resolve; });
  const { url } = await endpoint(t, env, (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => { aborted(); reject(new DOMException('Canceled', 'AbortError')); }, { once: true }); began();
  }));
  const controller = new AbortController();
  const response = fetch(url, { method: 'POST', headers: { ...headers, authorization: `Bearer ${env.MCP_ACCESS_TOKEN}` }, body: JSON.stringify(call('greenpoint_analyze_frame', frame)), signal: controller.signal }).catch(() => null);
  await started; controller.abort();
  await Promise.race([canceled, new Promise((_, reject) => setTimeout(() => reject(new Error('Upstream was not canceled')), 2000))]);
  await response;
});
