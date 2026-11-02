import { parseArgs } from 'node:util';
import { stat, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { modelUsage } from '../lib/meta-api.js';
import { runPerceptionAgent } from '../lib/agent-loop.js';
import { ExperimentBudget } from './budget.mjs';

const { values } = parseArgs({ options: { frame: { type: 'string' }, crop: { type: 'string', default: 'Sugar beet' }, out: { type: 'string', default: '../reviews/hackathon-sprint-2026-11-03/agent-trace.json' }, live: { type: 'boolean', default: false } } });
if (!values.live || !values.frame || !process.env.MODEL_API_KEY || !process.env.MCP_ACCESS_TOKEN) throw new Error('Use --live --frame path with server-only MODEL_API_KEY and MCP_ACCESS_TOKEN.');
if (!/^[a-zA-Z -]{2,40}$/.test(values.crop) || (await stat(values.frame)).size > 20_000_000) throw new Error('Invalid planted crop or oversized source image.');
const endpoint = new URL(process.env.GREENPOINT_MCP_URL || 'https://greenpoint-vert.vercel.app/api/mcp');
if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash || (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname)))) throw new Error('Use HTTPS or a loopback MCP endpoint.');
const { data, info } = await sharp(values.frame, { limitInputPixels: 30_000_000 }).rotate().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true });
if (data.length > 700_000) throw new Error('Prepared frame exceeds 700 KB.');
const image = `data:image/jpeg;base64,${data.toString('base64')}`;
const frameId = `scout-${Date.now()}`;
const budget = new ExperimentBudget(resolve('../reviews/hackathon-sprint-2026-11-03/budget.json'));
const client = new Client({ name: 'greenpoint-muse-scouter', version: '1.0.0' });
try {
  await client.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: { headers: { Authorization: `Bearer ${process.env.MCP_ACCESS_TOKEN}` } } }));
  const advertised = new Set((await client.listTools()).tools.map(tool => tool.name));
  const result = await runPerceptionAgent({ frameId, chat: async body => {
    const reservation = await budget.reserve('muse-agent:reasoning', 0.10);
    const response = await fetch('https://api.meta.ai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, model: 'muse-spark-1.3' }), signal: AbortSignal.timeout(60_000) });
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Agent provider rejected request (${response.status}).`); }
    const data = await response.json();
    await budget.settle(reservation, modelUsage(data.usage));
    return data;
  }, callTool: async (name, args) => {
    if (!advertised.has(name)) throw new Error('MCP does not advertise the requested tool.');
    const paid = name === 'greenpoint_analyze_frame';
    const reservation = paid ? await budget.reserve('muse-agent:mcp-perception', 0.50) : null;
    const reply = await client.callTool({ name, arguments: paid ? { frame_id: args.frame_id, device_id: 'muse-scouter-demo', crop: values.crop, image, width: info.width, height: info.height } : {} }, undefined, { timeout: 115_000 });
    if (reply.isError || !reply.structuredContent) throw new Error('MCP did not return verified structured evidence.');
    if (paid) await budget.settle(reservation, reply.structuredContent.usage);
    return reply.structuredContent;
  } });
  const out = resolve(values.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify({ ...result, recorded_at: new Date().toISOString(), endpoint: endpoint.origin + endpoint.pathname, source_image: { width: info.width, height: info.height } }, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ decision: result.decision, frame_id: frameId, tool_calls: result.trace.map(t => t.name), output: out }));
} catch (error) {
  let text = String(error.message);
  for (const secret of [process.env.MODEL_API_KEY, process.env.MCP_ACCESS_TOKEN]) if (secret) text = text.replaceAll(secret, '[redacted]');
  console.error(text); process.exitCode = 1;
} finally { await client.close(); }
