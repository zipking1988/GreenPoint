# Prototype Instructions

## GreenPoint visual decisions

- Current choice is original option2, superseding option3: dark forest, pale lime, white geometric display, precise computer-vision photography. Refer to DESIGN.md.
- Retain the first design’s entire-field map with “Every plant has a place.” and “Turn a simple phone video into a field map.”
- Current visual reference is `design/selected-dark-reference.png`. The earlier cream/Japanese editorial mock remains historical only.
- User asked for richer content and award-quality polish to impress judges. Prioritize a clear narrative, a finite interactive identity explanation, the complete map, sourced context, honest readiness, and responsive accessibility.
- Field-map markers must explain their category and plant ID without hover; keep labels readable and separated on mobile. This addresses the user’s GP-021 annotation.
- All current field artwork is AI-generated illustration. Live model processing, measured accuracy and pesticide savings are not implemented. Never present illustrative records or public policy targets as GreenPoint results.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

## Field intelligence dashboard

- User delegated dashboard strategy, design selection, implementation, review fixes, main push and Vercel production deployment on 2026-10-31. This supersedes the earlier landing-only/no-deployment scope.
- `/dashboard` and `/app` are the operational workspace. `/` remains the product narrative with a workspace link.
- Selected dashboard direction: `design/selected-dashboard-reference.png`, agent-selected under the user's explicit delegation. Preserve the existing dark forest/lime brand. Its invented dates, confidence scores and 36-plant totals are source shortcomings, not product data.
- Current sample is an eight-second static video of AI-generated artwork, with 12 hand-authored example records (7 crop, 3 weed, 2 uncertain). Never describe it as live inference, real footage, measured accuracy or validated tracking.
- User videos stay local in the current tab. Up to 12 JPEG snapshots across a clip are sent only after the operator starts live analysis. Video/frames are not persisted to a database.
- Model access needs server-only `MODEL_API_KEY` and `ANALYSIS_ACCESS_TOKEN`. The access code lives only in tab memory. Never expose either server value in a client bundle or health endpoint.
- Tracking is a conservative geometric baseline; sparse/ambiguous samples remain separate candidates. Image coordinates are not GPS. Human decisions remain distinct from original model labels, and reruns preserve old sessions.
- Verify with `npm run test:analysis`, `npm run build`, `npm run test:sites`, and the in-app browser. Keep the Sites package intact; the new Node API is deployed to Vercel.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
