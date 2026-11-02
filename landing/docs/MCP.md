# GreenPoint MCP for robot and drone agents

Endpoint: **https://greenpoint-vert.vercel.app/api/mcp**

GreenPoint exposes three tools and two resources through the official MCP TypeScript SDK, using stateless Streamable HTTP with JSON responses. A generic offboard agent can call it from a robot computer, ground station or backend. The camera/ROS/PX4/MAVSDK adapter remains your application's responsibility. No particular drone or robot has been tested.

## Available tools

| Tool | Input | Result | Access |
| --- | --- | --- | --- |
| `greenpoint_capabilities` | `{}` | Readiness, limits, data handling and coordinate semantics | Public; no model call |
| `greenpoint_sample_inventory` | `{ "label": "all" }`, or crop/weed/uncertain | 12 hand-authored illustrative records, optionally filtered | Public; no model call |
| `greenpoint_analyze_frame` | JPEG, dimensions, planted crop, frame ID; optional device ID and capture timestamp | SAM detections and Muse Spark candidate classifications | Dedicated Bearer token; billable Meta calls |

Resources: `greenpoint://schema/frame-input` (JSON Schema) and `greenpoint://sample/inventory` (JSON). The illustrative inventory is static and explicitly marked. It does not contain browser-local uploaded videos or operator review decisions.

## Try the actual protocol

From `landing/`, after `npm ci`:

```bash
npm run robot:sample
node scripts/robot-client.mjs capabilities
```

These use the official MCP client, including initialization and tool discovery/calls. No provider account is needed. In the dashboard, open **Connection settings → Robots & agents → Run MCP test** to exercise the same public endpoint.

Example for another Node agent:

```js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({ name: 'field-robot-agent', version: '1.0.0' });
const token = process.env.GREENPOINT_MCP_TOKEN;
await client.connect(new StreamableHTTPClientTransport(
  new URL('https://greenpoint-vert.vercel.app/api/mcp'),
  { requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined },
));
try {
  const result = await client.callTool({ name: 'greenpoint_sample_inventory', arguments: { label: 'uncertain' } });
  console.log(result.structuredContent);
} finally {
  await client.close();
}
```

Clients must support Streamable HTTP and, for live analysis, a custom Authorization header. This release uses an owner-managed service token; it does **not** implement OAuth discovery, user sign-in or dynamic client registration. Do not assume every chat application's MCP connector supports it.

## Configure live perception

Set server-only `MODEL_API_KEY` and a separate high-entropy `MCP_ACCESS_TOKEN` in Vercel and redeploy. Provision that robot token to your agent as `GREENPOINT_MCP_TOKEN`. Keep the dashboard's `ANALYSIS_ACCESS_TOKEN` separate. Never put tokens in URLs, screenshots, client bundles or committed files. Public tools remain usable when live analysis is unconfigured.

The provided client prepares a real local image before sending it:

```bash
# Inject GREENPOINT_MCP_TOKEN through your normal secret manager first.
npm run robot:analyze -- /absolute/path/to/frame.jpg --crop Maize --device robot-01
```

For local development, set `GREENPOINT_MCP_URL=http://127.0.0.1:4173/api/mcp`. The client permits HTTP only on loopback. Native clients omit `Origin`; browser clients must use an allowed origin. Add browser origins using the server's comma-separated `MCP_ALLOWED_ORIGINS` if needed; wildcard origins are not accepted.

`greenpoint_analyze_frame` accepts:

```json
{
  "frame_id": "frame-0001",
  "device_id": "robot-01",
  "image": "data:image/jpeg;base64,<actual JPEG bytes>",
  "width": 960,
  "height": 540,
  "crop": "Maize",
  "captured_at": "2026-10-31T09:30:00Z"
}
```

The JPEG must be orientation-normalized, no larger than approximately 750 KB, and 32–1280 pixels on each axis. Dimensions are verified against a real image decode. Crop choices are Maize, Lettuce, Soybean, Sugar beet, Rice and Wheat. Frame/device IDs accept letters, digits, dot, underscore, colon and hyphen. Remote image/video URLs are not fetched.

## Interpret the output correctly

- `box` is `[x, y, width, height]` normalized to the source image, with the origin at its top-left. It is **not GPS, camera-to-ground projection or a navigation waypoint**.
- IDs are scoped to one response. `GP-001` in a later frame is not guaranteed to be the same plant. Frame identity and cross-frame association belong in your adapter.
- At most 16 candidates per frame are classified; `limited: true` means partial coverage. This is request/response perception, not continuous video streaming or a real-time control loop.
- `original_label` preserves the model's suggestion; confidence below 0.75 yields effective `label: "uncertain"`. Confidence is uncalibrated. No accuracy claim is made.
- All candidates carry `reviewed: false` and `requires_human_review: true`. `treatment_authorized` is always false. No tools issue hardware commands.
- A classification failure returns `isError: true`, `status: "partial"` and the detections already obtained. Unclassified plants retain `original_label: null`; do not treat partial output as a completed inventory. After a connection loss, retry is a new billable request, not an exactly-once operation.
- The service persists no images, results or device sessions. Authorized calls transmit the frame and plant crops to Meta. Your agent must store results if needed. Browser-local review decisions are not synchronized to MCP.

The same server-side analysis implementation passed a first real Meta single-frame check on public PhenoBench data on 2026-11-03; see the [validation record](meta-live-validation-2026-11-03.md). No physical device has been tested. Automated tests cover the full MCP transport with the official client and a controlled fake model upstream, image decoding/cropping, authentication, partial results and cancellation. These checks do not establish field performance.

## Deployment and checks

`api/mcp.js` is a Node function with a 120-second limit; model work has a shared 110-second deadline. Each HTTP request gets a fresh server/transport. There is no in-memory cross-device session store. The existing Sites static worker does not host this Node endpoint.

```bash
npm run test:mcp
npm run test:analysis
npm run test:sites
npm run build
```

Official references: [MCP server SDK](https://ts.sdk.modelcontextprotocol.io/server), [Streamable HTTP specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).


## Evidence sprint additions / 2026-11-03

Frame perception now returns schema 1.1 with `classification_strategy`, `crop_reference_used` and best-effort usage estimates. A missing usage breakdown is unknown, not free. The default baseline classifies bounded tight crops in batches of four. Optional `crop_reference` is an orientation-normalized JPEG ≤100 KB, confirmed by the caller; it and same-source context crops are sent to Meta. References are experimental: the development comparison increased crop-as-weed errors. Never send reference annotations or claim this improves accuracy.

A real Muse Spark scouter example is available at `scripts/muse-agent.mjs`. It advertises only capability discovery and a host-owned frame handle, actually invokes the authenticated MCP tool, and permits at most two tool calls over three model turns. It cannot read arbitrary files, choose an upstream URL, or request navigation/treatment. The final next step is `human_review`, `request_closer_view` or `no_candidates`, with mandatory review and no treatment authorization. An empty result cannot establish weed-free ground.

From `landing/`, after the owner provides server-only variables in ignored `.env.local`:

```sh
node --env-file=.env.local scripts/muse-agent.mjs --live --frame /absolute/path/to/public-field.jpg --crop "Sugar beet"
```

`GREENPOINT_MCP_URL` defaults to the existing production endpoint; loopback HTTP is allowed for local development. The runner reads `MCP_ACCESS_TOKEN` without exposing it to Muse. It reserves cost in `reviews/hackathon-sprint-2026-11-03/budget.json`; run paid sprint scripts sequentially. Unknown cost retains its reservation. The separate robot-client example continues to use `GREENPOINT_MCP_TOKEN`.

A labeled recorded trace is available at `/assets/verified-run/agent-trace.json`. This demonstrates an upper-level software agent, not a physical robot or drone. The public frozen-image report at `/validation.html` explains the failed weed-recall target and native-video checks with zero candidates.
