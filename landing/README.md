# GreenPoint landing

A responsive React/Vite landing page and field-analysis workspace for phone-first per-plant weed mapping. The selected art direction is dark forest, pale lime and botanical computer vision.

## Local preview

With Node.js 22 or newer, run `npm ci`, then `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort`. Open `/dashboard` for the workspace and `/` for the landing. Production build: `npm run build`. Analysis checks: `npm run test:analysis`. Packaging checks: `npm run test:sites`.

## Vercel deployment

Use `landing` as the Vercel project's Root Directory and `main` as its production branch. `vercel.json` installs with `npm ci`, runs the existing build, and publishes `dist/client`. The additional Sites worker output remains available for a separate Sites handoff.

The `api/` directory contains Node functions for Vercel. Local Vite uses the same handler. The Sites static worker is preserved but does not run the new Node inference API.

## Connect live analysis

Set `MODEL_API_KEY` and `ANALYSIS_ACCESS_TOKEN` as server-only Vercel environment variables, then redeploy. For local development, copy `.env.example` to `.env`, supply the values and restart Vite. Do not use `VITE_` prefixes. In the workspace's Connection settings, enter the analysis access code. It stays in memory for that tab.

The API uses Meta's fixed `sam-3.1` Responses endpoint and `muse-spark-1.3` Chat Completions endpoint. The original video remains local; up to 12 JPEG snapshots across the clip are segmented and cropped plants are classified. Each request is capped, authenticated and cancellable. Clips are limited to 150 MB and two minutes. The live candidate inventory is capped at 96 with explicit partial-coverage messaging. Sparse frames are not silently deduplicated.

Live execution has not been validated against a paid Meta account in this development session because no provider credential is configured. Tests verify the transport, authentication, official SAM grammar, output validation and failure paths with mocked upstream responses. No mock response is used by the production inference endpoint.

## What works

- Same-scene simulated tracking explanation with finite playback, pause, replay, scrubbing and reduced-motion support.
- Complete field atlas with four labeled illustrative samples, review filtering, inspection and an actual sample CSV download.
- Pipeline tabs, native FAQ, mobile navigation and full-map modal.
- Dashboard video playback, local video extraction, frame selection, selected-plant evidence, classification filters/search, frame atlas, human review and actual CSV export.
- Server inference integration with explicit missing-configuration, provider error, cancellation and partial-output handling. Reruns keep previous sessions and human decisions.

## Prototype boundaries

The deployed workspace opens in sample mode until server credentials are configured. Its sample contains 12 hand-authored records over an eight-second static preview of AI-generated imagery, not live model output. Classification accuracy and tracking performance remain unvalidated. CSV locations are normalized source-frame coordinates, not GPS. No spraying or chemical prescription is performed.

## Project files

`DESIGN.md` records the selected system. `design/research-brief.md` records sources and evidence limits. `design-qa.md` records final browser verification and visual comparison. Source: `src/App.jsx`, `src/content.js`, `src/MeasuredCopy.jsx`, `src/styles.css`.

## Asset provenance

Assets were produced using the built-in ImageGen tool. Original generations are retained in the development workspace at `design/source-assets`; the repository contains the WebP versions used by the page. Visual prompts: documentary Japanese farm walk; plant-level segmentation close-up; full top-down vegetable plot with crop/weed/review highlights; and dark corn-seedling computer-vision hero. These are illustrative brand/concept assets, not benchmark inputs. Self-hosted Sora, Source Sans3 and IBM Plex Mono use their bundled SIL Open Font Licenses. Icons: Phosphor, MIT. Pretext: MIT.

Dashboard source: `src/dashboard/`. Meta SAM parsing uses `@meta-sam/parser` 0.1.0 from [meta-models/meta-sam](https://github.com/meta-models/meta-sam), under its SAM License. A copy is served at `/licenses/meta-sam.txt`. The dashboard panorama is a separate generated asset; the sample video is a static H.264 encoding of that illustration. See the repository-root `design-qa.md` for dashboard verification.
