# Prototype Instructions

## Farmer version restored / 2026-11-01

- The user explicitly asked to restore yesterday's original farmer-focused product. Release `409e71d` is the reference before the garden and plant-agent pivots. This supersedes those later product directions.
- Restore the "See the field. Plant by plant." landing, farmer/field-walk narrative, tracking explanation, entire-field atlas and the approved map/evidence dashboard. Default `/dashboard` and `/app` open the field map; `?view=video` opens field video review and `upload=1` opens its upload dialog.
- Preserve charcoal/sage roles, the map-to-evidence connector, honest illustrative provenance, separate human decisions, existing analysis safeguards and generic MCP perception. Keep browser history navigation and close dialogs when their workspace becomes hidden.
- Later plant-agent designs remain in Git history as prior explorations, not the current product. Do not reintroduce Milo, plant voices, imagined soil checks or the plant journal as the landing/default workspace unless the user asks again.

## GreenPoint visual decisions

- Current composition is original option2, superseding option3: geometric display and precise computer-vision photography. The user-approved charcoal/sage refinement below governs current colors; pale lime remains the brand accent. Refer to DESIGN.md.
- Retain the first design’s entire-field map with “Every plant has a place.” and “Turn a simple phone video into a field map.”
- Current visual reference is `design/selected-dark-reference.png`. The earlier cream/Japanese editorial mock remains historical only.
- User asked for richer content and award-quality polish to impress judges. Prioritize a clear narrative, a finite interactive identity explanation, the complete map, sourced context, honest readiness, and responsive accessibility.
- Field-map markers must explain their category and plant ID without hover; keep labels readable and separated on mobile. This addresses the user’s GP-021 annotation.
- All current field artwork is AI-generated illustration. Live model processing, measured accuracy and pesticide savings are not implemented. Never present illustrative records or public policy targets as GreenPoint results.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

## Approved color refinement / 2026-10-31

- User approved the color-audit recommendation: reduce broad green UI surfaces and decorative lime across landing + dashboard. Use the charcoal/sage roles in `src/palette.css`; keep the hero phrase, brand, primary actions and current interaction lime. This supersedes the old mock colors while preserving their layout, typography and photography.
- Crop is sage #afc3a4 in both CSS and `LABELS.crop.color` (decoded masks). Weed coral and Review amber retain their labels and symbols. Never reuse brand lime as the generic crop-data token. Dialogs and loading/error states use the shared palette too.

## Field intelligence dashboard

- User delegated dashboard strategy, design selection, implementation, review fixes, main push and Vercel production deployment on 2026-10-31. This supersedes the earlier landing-only/no-deployment scope.
- `/dashboard` and `/app` are the operational workspace. `/` remains the product narrative with a workspace link.
- Selected dashboard direction: `design/selected-dashboard-reference.png`, agent-selected under the user's explicit delegation. Preserve the existing dark forest/lime brand. Its invented dates, confidence scores and 36-plant totals are source shortcomings, not product data.
- Current sample is an eight-second static video of AI-generated artwork, with 12 hand-authored example records (7 crop, 3 weed, 2 uncertain). Never describe it as live inference, real footage, measured accuracy or validated tracking.
- User videos stay local in the current tab. Clips up to 120 seconds can be previewed; only clips up to six seconds can be analyzed, using up to 12 JPEG snapshots at 0.5-second intervals after the operator starts live analysis. Video/frames are not persisted to a database.
- Model access needs server-only `MODEL_API_KEY` and `ANALYSIS_ACCESS_TOKEN`. The access code lives only in tab memory. Never expose either server value in a client bundle or health endpoint.
- Tracking is a conservative geometric baseline; sparse/ambiguous samples remain separate candidates. Image coordinates are not GPS. Human decisions remain distinct from original model labels, and reruns preserve old sessions.
- Review states are pending, confirmed, or deferred; the Review queue contains all unconfirmed plants. Export per-plant provenance and run identity, and warn before leaving unsaved local analysis results.
- User chose generic MCP for different devices' upper-level agents on 2026-10-31. `/api/mcp` provides public capabilities/sample tools and separate `MCP_ACCESS_TOKEN`-protected single-frame perception. Never describe it as tested ROS/PX4 hardware integration, a real-time control loop, geographic mapping, or a source of browser-local human decisions. Preserve stateless per-request transport and mandatory review flags. Run `npm run test:mcp` after changes.
- Verify with `npm run test:analysis`, `npm run build`, `npm run test:sites`, and the in-app browser. Keep the Sites package intact; the new Node API is deployed to Vercel.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved map-led dashboard / 2026-10-31

- User selected the immersive map from the first map concept, the evidence/decision interaction from the third, then explicitly approved the hybrid with a GP-007 source connector. Visual target: `design/selected-field-map-reference.png`. This supersedes the old default dashboard layout; preserve its charcoal/sage colors.
- Default workspace is an illustrative whole-field map with coral weed zones, amber uncertain zones, and gray hatched unobserved areas. Never equate unobserved with weed-free.
- Source selection, evidence crop and connector must share the same image and plant ID. Connector follows pan, zoom, resize and selection; hide it when the source is outside the map.
- Map sample decisions use separate versioned browser storage. Existing video sessions and MCP perception remain available. User footage does not become a geographic map without georeferencing. No invented GPS, metric area, measured weed coverage, navigation or hardware actions.
