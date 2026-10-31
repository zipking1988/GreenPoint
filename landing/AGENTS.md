# Prototype Instructions

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

## Approved garden landing / 2026-10-31

- The user selected a mix of garden concepts 1 and 2, approved the hybrid, then explicitly asked to retain the existing `vision-field.webp` hero image and composition. This latest instruction supersedes the hybrid's older-woman hero. Preserve the original botanical hero; use the source-linked evidence section from `design/garden-concepts/04-hybrid-human-evidence.png` below it.
- Landing audience is everyday vegetable gardeners, including older growers and family helpers, without a Japan-only or drone-only framing. “See what grows. Plant by plant.” leads to short-video upload. Do not promise physical labour reduction or imply validated consumer demand.
- The primary landing action opens `/dashboard?view=video&upload=1`. `/dashboard?view=video` opens video review; the default `/dashboard` map remains available. The user explicitly delegated implementation, review fixes, main push and Vercel production deployment for this work.
- Landing GP-007 is its own illustrative example over `garden-evidence.webp`. Its evidence crop must come from the same raster and rectangle shown in the source image. Model suggestion stays uncertain while human choices are confirmed crop/weed or deferred. It does not alter dashboard/MCP decisions. Its export labels illustrative provenance and normalized image coordinates.
- Keep the shared charcoal/sage tokens, geometric Sora display, Source Sans 3 body, and purposeful finite motion with reduced-motion support. Preserve native scrolling and readable 44px-or-larger controls. Live-model validation remains pending while server credentials are unavailable.

## Enriched garden narrative / 2026-10-31

- User asked for more substantive landing information and delegated selection, implementation, code review, fixes, main push and Vercel deployment. Preserve the approved botanical hero and evidence interaction.
- Below the hero, explain the ordinary gardener's problem with linked Thrive/RHS sources; include a four-stage, user-controlled video workflow, fair competitor context, error boundaries, readiness and practical FAQs. No autoplay or scroll interception.
- Research sources inform a hypothesis; they are not endorsements, customer interviews or proof of demand. Older growers are an intended audience, not a validated demographic. Do not present the generated grower illustration as a customer.
- Workflow illustrations must be labeled, make no API calls and keep image-relative overlays aligned with the uncropped source. Upload creates local preview; configured analysis starts only on explicit action.

## Plant-agent landing pivot / 2026-10-31

- User explicitly changed the product narrative to “let plants use LLMs”: every plant has an agent that observes, remembers context, asks for care and receives human feedback. User authorized redesign, agent-selected direction, code review/fixes, main push and Vercel production deployment without further preference questions. This supersedes prior garden/older-grower positioning, landing GP-007 interaction and upload-as-primary requirements. Preserve the original botanical hero raster and dashboard behavior.
- Selected visual: `design/plant-agent/selected.webp` (The Living Network, first displayed concept, selected under delegation). Reuse charcoal/sage/lime, Sora/Source Sans3 and Phosphor. The photograph in the concept is superseded by the exact retained `vision-field.webp`; new Milo portrait is an explicitly generated illustration.
- Milo is a fictional tomato. Its voice, request branches and memory journal are a scripted interactive concept, with no model/sensor calls. Label scenarios as visitor-selected simulation in UI/export, never real plant observations. All branches retain a human follow-up request; no watering/equipment actions.
- Landing journal is local to this page, capped at30scenario entries with the total/retained count disclosed, reset creates a new session ID, and JSON export preserves identity/provenance/non-actuation flags. Keyboard users must be able to focus and scroll the journal.
- Existing perception remains at `/dashboard?view=video`; agent concept is primary, perception is secondary. Real-provider validation, persistent plant profiles, LLM plant-care requests and tools are future work, not implemented agents. State current versus planned explicitly.
- Native scroll and reduced motion remain required. Monid has no active key and Higgsfield workspace probe returns an auth hint; no paid cinematic render or full scroll-world film is shipped.
