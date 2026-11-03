# Prototype Instructions

## Landing evidence refresh approved / 2026-11-03

- User approved the Product Design audit follow-up: preserve the farmer visual direction, place real source-pixel evidence before the simulated explanation, introduce the recorded Muse → MCP loop, unify the primary workspace CTA, and clean up old copy on desktop and mobile.
- The landing reads the existing published recordings; opening it or selecting a plant/agent step must not start live inference. Keep the example's selection bias and failed overall validation target visible.
- Plant highlight, crop and model reasoning in the real-evidence preview must come from the same published session and selected plant. The MCP sequence is a separate recorded request; do not mix its candidate labels with the workspace recording.
- Keep important provenance and limitations readable on mobile. Recorded public UAV/robot imagery does not validate Japanese phone-camera use, geographical mapping or physical robot operation.

## Evidence sprint approved / 2026-11-03

- User approved the “Every recognition has evidence” sprint and delegated implementation, review fixes, GitHub main push, Vercel production deployment and verification. Preserve the farmer narrative and charcoal/sage design.
- Default workspace may open a clearly labeled **Recorded real Meta run**, with its original source frames, timestamp, models, clip hash and attribution. No fresh inference occurs on page load. The illustrative whole-field layout remains explicitly selectable.
- Real map and video review share sessions, plant selection and human decisions. Render only observations from the displayed source frame; never project a best-frame box or mask onto another frame. These are source-image coordinates, without GPS, metric area, weed-density estimates, treatment or navigation.
- Native SAM video is an explicit opt-in. Its complete selected clip is sent to Meta only after disclosure and operator initiation. Enforce server bounds: H.264 MP4, 2 MB, 6 seconds, 1280 px per axis, 30 fps and one orientation-normalized video track. No silent fallback to frame sampling. The default sampled-frame mode keeps the original video local.
- Optional crop references must be operator-confirmed and remain separate from model output and human review labels. Development found the reference strategy increased crop-as-weed errors, so baseline remains default. Mark reference comparisons experimental and do not claim improvement.
- Benchmark selection is frozen before inference: 5 development / 20 evaluation PhenoBench images, seed 20261103, previous smoke image excluded. Ground truth stays out of model input; only the development reference may inform an experimental comparison. Include uncertain labels, missed plants and failed requests. Do not tune using evaluation labels.
- Experiment budget is $10 total; stop new experiments at $8 and reserve $2 for regression. Use the shared sequential budget ledger; unknown billing retains its reservation. Report estimated usage as an estimate, never a reconciled bill.
- Bonn footage is real BoniRob camera footage, not Japanese phone or drone footage. Its per-frame semantic annotation keys are not persistent tracking ground truth. Native identities are scoped to one clip; hardware and tracking accuracy remain unvalidated.
- Muse scouter must actually request MCP evidence through bounded function calls. Its only next steps are human_review, request_closer_view or no_candidates. Never claim actual drone/robot actuation or farmer feedback that did not occur.
- Release checks include test:evidence, existing analysis/MCP/map/probe/Sites checks, build, desktop/mobile browser review, real-provider flow and production authentication. Keep secrets out of Git and public artifacts.

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
- All current built-in field artwork is AI-generated illustration. Real Meta processing was first exercised on separate public test data on 2026-11-03; it is not a measured accuracy or pesticide-savings result. Never present illustrative records or public policy targets as GreenPoint results.

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

## First real Meta integration check / 2026-11-03

- A real PhenoBench sugar-beet RGB image ran through SAM 3.1 and Muse Spark 1.3: 12 candidates, 1 effective crop label and 11 uncertain, about 22 seconds, 3 provider requests. Preserve uncertainty; this is an integration check, not evidence of reliable weed recognition or held-out accuracy.
- The real Pexels maize-canopy clip (Tom Fisk, video 13525083, 1-second excerpt) exercised browser upload and 2 sampled frames; it returned 0 candidates. Do not use that result as a weed-free claim or tracking validation.
- Any clip made from the PhenoBench still must be identified as a still-photo pipeline check. It is not genuine camera motion or evidence of tracking performance.
- `npm run meta:probe` defaults to local preflight without network access. Only explicit `--live` sends public RGB evidence to Meta. Ground-truth annotations stay separate. Run `npm run test:meta-probe` when changing the runner, and keep keys/tokens out of Git, screenshots and generated bundles.
