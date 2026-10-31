import { timingSafeEqual } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { ApiError } from './meta-api.js';
import { analyzeRobotFrame, MAX_FRAME_PLANTS } from './robot-analysis.js';
import { sampleSession } from '../src/dashboard/data.js';

const MAX_BODY = 1_100_000;
const ANALYZE_TOOL = 'greenpoint_analyze_frame';
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const identity = z.string().min(1).max(80).regex(/^[a-zA-Z0-9_.:-]+$/);
export const frameInput = {
  image: z.string().max(1_000_000).regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/).describe('Orientation-normalized JPEG data URL, at most 750 KB. Never a remote URL.'),
  width: z.number().int().min(32).max(1280), height: z.number().int().min(32).max(1280),
  crop: z.enum(['Maize', 'Lettuce', 'Soybean', 'Sugar beet', 'Rice', 'Wheat']),
  frame_id: identity.describe('Caller-owned frame identity. Plant IDs are scoped to this one response.'),
  device_id: identity.optional(), captured_at: z.iso.datetime({ offset: true }).optional(),
};
export const FRAME_SCHEMA = z.toJSONSchema(z.object(frameInput));

export function capabilities(env = process.env) {
  return {
    name: 'GreenPoint', version: '1.0.0', transport: 'streamable-http', stateless: true,
    tools: ['greenpoint_capabilities', 'greenpoint_sample_inventory', ANALYZE_TOOL],
    public_tools: ['greenpoint_capabilities', 'greenpoint_sample_inventory'],
    live_analysis_configured: Boolean(env.MODEL_API_KEY && env.MCP_ACCESS_TOKEN),
    analysis_authentication: 'Authorization: Bearer <MCP_ACCESS_TOKEN>',
    authentication_mode: 'owner_managed_token; no OAuth discovery',
    limits: { jpeg_bytes: 750_000, frame_long_edge: 1280, plants_per_frame: MAX_FRAME_PLANTS, request_deadline_seconds: 110 },
    coordinate_system: 'normalized_image_xywh', identity_scope: 'one_frame_response',
    confidence_calibrated: false, requires_human_review: true, treatment_authorized: false,
    data_retention: 'No images, results, or device sessions are persisted by this service.',
    model_processing: 'Authorized live calls send the frame and cropped plant images to Meta.',
    unsupported: ['flight_control', 'navigation', 'real_time_obstacle_avoidance', 'actuation', 'GPS_projection', 'cross_frame_tracking', 'browser_session_sync'],
  };
}

export function sampleInventory(label = 'all') {
  const session = sampleSession();
  const plants = session.plants.filter(p => label === 'all' || p.label === label).map(p => ({
    id: p.id, label: p.label, original_label: p.originalLabel, box: p.box,
    confidence: null, reviewed: false, requires_human_review: true, reasoning: p.reasoning,
  }));
  return {
    schema_version: '1.0', mode: 'illustrative_sample', provenance: 'Hand-authored annotations on AI-generated artwork; not real detections or field measurements.',
    session_id: session.id, identity_scope: 'illustrative_sample_only',
    image: { width: session.width, height: session.height, coordinate_system: 'normalized_image_xywh', origin: 'top_left' },
    total: session.plants.length, returned: plants.length, plants,
    confidence_calibrated: false, requires_human_review: true, treatment_authorized: false,
    browser_decisions_included: false,
  };
}

const toolResult = (value, isError = false) => ({ content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value, ...(isError ? { isError: true } : {}) });

export function createGreenPointMcp({ env = process.env, fetcher = fetch, signal, authorized = false } = {}) {
  const server = new McpServer({ name: 'greenpoint', version: '1.0.0' }, {
    instructions: 'GreenPoint provides field-plant perception. Sample data is illustrative. Live image coordinates are not GPS; plant identities are scoped to one frame. Always retain uncertainty and human review. This server cannot authorize or perform physical actions.',
  });
  server.registerTool('greenpoint_capabilities', { title: 'GreenPoint capabilities', description: 'Read current connection readiness, limits, coordinate semantics and supported operations. No model call.', inputSchema: {}, annotations: readOnly }, async () => toolResult(capabilities(env)));
  server.registerTool('greenpoint_sample_inventory', {
    title: 'Illustrative plant inventory', description: 'Read the public, hand-authored demo inventory for integration testing. Not live results, operator decisions, or real field data.',
    inputSchema: { label: z.enum(['all', 'crop', 'weed', 'uncertain']).default('all') }, annotations: readOnly,
  }, async ({ label }) => toolResult(sampleInventory(label)));
  server.registerTool(ANALYZE_TOOL, {
    title: 'Analyze one field image', description: 'Billable frame-level perception via Meta SAM and Muse Spark. Requires an owner-provisioned Bearer token. Sends this image and plant crops to Meta. Returns candidate labels, normalized boxes and mandatory human-review flags. Does not control hardware or persist results.',
    inputSchema: frameInput,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async (input, extra) => {
    if (!env.MODEL_API_KEY || !env.MCP_ACCESS_TOKEN) return toolResult({ code: 'not_configured', error: 'Live analysis requires server model credentials and a dedicated MCP access token.' }, true);
    if (!authorized) return toolResult({ code: 'access_required', error: 'A valid MCP Bearer token is required.' }, true);
    try {
      const signals = [AbortSignal.timeout(110_000), extra.signal, signal].filter(Boolean);
      const result = await analyzeRobotFrame(input, env, fetcher, AbortSignal.any(signals));
      return toolResult(result, result.status === 'partial');
    } catch (error) {
      return toolResult({ code: error instanceof ApiError ? error.code : 'analysis_failed', error: error instanceof ApiError ? error.message : 'Frame analysis could not finish. Retry with a clear JPEG snapshot.' }, true);
    }
  });
  server.registerResource('observation-input', 'greenpoint://schema/frame-input', { mimeType: 'application/schema+json', description: 'Input contract for one orientation-normalized field frame.' }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/schema+json', text: JSON.stringify(FRAME_SCHEMA) }] }));
  server.registerResource('sample-inventory', 'greenpoint://sample/inventory', { mimeType: 'application/json', description: 'Public illustrative records, without browser-local operator decisions.' }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(sampleInventory()) }] }));
  return server;
}

function tokenMatches(value, expected) {
  if (!expected || typeof value !== 'string' || !/^Bearer /i.test(value)) return false;
  const supplied = Buffer.from(value.slice(7)); const known = Buffer.from(expected);
  return supplied.length === known.length && timingSafeEqual(supplied, known);
}

async function readMessage(req) {
  if (req.body && typeof req.body === 'object') {
    if (Buffer.byteLength(JSON.stringify(req.body)) > MAX_BODY) throw new ApiError(413, 'MCP request exceeds the frame limit.', 'payload_too_large');
    return req.body;
  }
  const chunks = []; let size = 0;
  if (typeof req.body === 'string') { size = Buffer.byteLength(req.body); chunks.push(Buffer.from(req.body)); }
  else for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new ApiError(413, 'MCP request exceeds the frame limit.', 'payload_too_large');
    chunks.push(Buffer.from(chunk));
  }
  if (size > MAX_BODY) throw new ApiError(413, 'MCP request exceeds the frame limit.', 'payload_too_large');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'Send one valid JSON-RPC message.', 'invalid_json'); }
}

export async function handleMcp(req, res, env = process.env, fetcher = fetch) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (status, message, code = -32000, id = null) => {
    if (res.destroyed || res.writableEnded || res.headersSent) return;
    res.statusCode = status; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }));
  };
  const origins = new Set(['https://greenpoint-vert.vercel.app', 'https://greenpoint-zipking.vercel.app', ...(env.VERCEL_URL ? [`https://${env.VERCEL_URL}`] : []), ...(env.MCP_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean)]);
  if (env.NODE_ENV !== 'production') { origins.add('http://127.0.0.1:4173'); origins.add('http://localhost:4173'); }
  const origin = req.headers.origin;
  if (origin && !origins.has(origin)) return send(403, 'This browser origin is not allowed.');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, MCP-Protocol-Version');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return send(405, 'Use MCP Streamable HTTP POST; standalone SSE and sessions are not supported.'); }
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return send(415, 'Use application/json.');
  const controller = new AbortController();
  const disconnected = () => { if (!res.writableEnded) controller.abort(); };
  req.once('aborted', disconnected); res.once('close', disconnected);
  if (req.aborted || res.destroyed) controller.abort();
  let server; let transport;
  try {
    const body = await readMessage(req);
    if (Array.isArray(body)) return send(400, 'JSON-RPC batching is not supported.', -32600);
    const authorized = tokenMatches(req.headers.authorization, env.MCP_ACCESS_TOKEN);
    if (body?.method === 'tools/call' && body.params?.name === ANALYZE_TOOL && env.MODEL_API_KEY && env.MCP_ACCESS_TOKEN && !authorized) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="greenpoint-mcp"');
      return send(401, 'A dedicated MCP Bearer token is required for live analysis.', -32001, body.id ?? null);
    }
    server = createGreenPointMcp({ env, fetcher, signal: controller.signal, authorized });
    transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (error) {
    send(error instanceof ApiError ? error.status : 500, error instanceof ApiError ? error.message : 'The MCP request could not finish.', error?.code === 'invalid_json' ? -32700 : -32603);
  } finally {
    req.removeListener('aborted', disconnected); res.removeListener('close', disconnected);
    await transport?.close().catch(() => {}); await server?.close().catch(() => {});
  }
}
