# GreenPoint landing

A responsive React/Vite landing page and field-analysis workspace with an illustrative field map and a phone-first plant candidate inventory. The selected art direction uses charcoal surfaces, pale lime brand accents, sage crop data and botanical computer-vision imagery.

Restored to the farmer-focused direction on 2026-11-01. The reference is release `409e71d`, with browser-history navigation and hidden-dialog fixes retained. Direct links to `/dashboard?view=video` and `/app?view=video&upload=1` remain supported. Later garden/plant-agent explorations are recoverable through Git history.

## Local preview

With Node.js 22 or newer, run `npm ci`, then `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort`. Open `/dashboard` for the workspace and `/` for the landing. Production build: `npm run build`. Map checks: `npm run test:map`. Analysis checks: `npm run test:analysis`. MCP checks: `npm run test:mcp`. Packaging checks: `npm run test:sites`.

## Vercel deployment

Public production site: [GreenPoint](https://greenpoint-vert.vercel.app/).

Use `landing` as the Vercel project's Root Directory and `main` as its production branch. `vercel.json` installs with `npm ci`, runs the existing build, and publishes `dist/client`. The additional Sites worker output remains available for a separate Sites handoff.

The `api/` directory contains Node functions for Vercel. Local Vite uses the same handler. The Sites static worker is preserved but does not run the new Node inference API.

## Connect live analysis

Set `MODEL_API_KEY` and `ANALYSIS_ACCESS_TOKEN` as server-only Vercel environment variables, then redeploy. For local development, copy `.env.example` to `.env`, supply the values and restart Vite. Do not use `VITE_` prefixes. In the workspace's Connection settings, enter the analysis access code. It stays in memory for that tab.

The API uses Meta's fixed `sam-3.1` Responses endpoint and `muse-spark-1.3` Chat Completions endpoint. The original video remains local. Clips up to 150 MB and two minutes can be previewed; analysis requires a clip of at most six seconds, sampled every 0.5 seconds up to 12 JPEG snapshots. Crop images are classified only after the operator starts analysis. Requests are bounded, authenticated and cancellable. The live candidate inventory is capped at 96 with explicit partial-coverage messaging. Ambiguous observations are not silently deduplicated.

Analysis results stay in the current tab. After exporting CSV, check that the file was saved and confirm it in the workspace; until then the browser warns before leaving. Changes made after an export need a new export.

Real-provider execution passed a first public-image integration check on 2026-11-03: SAM 3.1 and Muse Spark returned 12 candidates (1 crop, 11 uncertain) in about 22 seconds. This is not field accuracy or a successful weed-recognition benchmark. A real maize-canopy video also exercised upload and two sampled frames but returned no candidates. See the [validation record](docs/meta-live-validation-2026-11-03.md). Automated tests cover transport, authentication, SAM grammar, validation and failure paths using controlled upstream responses. The production inference endpoint uses no mock model output.

For a reproducible first real-image check, `npm run meta:probe -- /absolute/path/to/field.png --crop "Sugar beet"` prepares local evidence without any API call. Live mode requires an explicit `--live` and a configured provider key. See the [Meta validation guide](docs/META-VALIDATION.md) for limits, saved evidence and the remaining video/deployment checks.

## Field-map workspace

`/dashboard` and `/app` now open the approved map-led workspace. Select an illustrative weed region, follow the source connector to the same-image crop, choose Crop / Weed / Keep for review, then Save & next. Pan, wheel/pinch zoom, keyboard arrows and +/- and Fit field operate in local image coordinates. Evidence selection and its connector follow the map; small screens reveal the evidence below the map with the same plant ID. Coverage distinguishes unobserved space from weed-free land.

The map has 12 separate, hand-authored examples over `/assets/survey-field.webp`, with its own versioned browser review storage. The Review queue supports reset and CSV export. Its illustrative region signals are static examples, not recomputed weed-density measurements. The map and the original video sample are separate coordinate/identity namespaces. MCP's public sample remains the original video sample and does not return these browser-local map decisions.

Use **Video** or **Upload footage** to open the existing video workspace; sessions remain in memory when switching back to the map. Footage without location metadata stays a source-frame review rather than being presented as a geographic map. A real drone map requires georeferencing, calibration and position-accuracy validation; the prototype provides no GPS, area measurement, navigation export or hardware command.

## What works

- Same-scene simulated tracking explanation with finite playback, pause, replay, scrubbing and reduced-motion support.
- Complete field atlas with four labeled illustrative samples, review filtering, inspection and an actual sample CSV download.
- Pipeline tabs, native FAQ, mobile navigation and full-map modal.
- Dashboard video playback, local video extraction, frame selection, selected-plant evidence, classification filters/search, frame atlas, pending/confirmed/deferred human review and CSV export with per-plant provenance.
- Server inference integration with explicit missing-configuration, provider error, cancellation and partial-output handling. Reruns keep previous sessions and human decisions.
- Generic robot/agent MCP integration at `/api/mcp`: public capability discovery and illustrative sample reads, plus authenticated single-frame analysis. The connection dialog includes an actual protocol test. See the [MCP integration guide](docs/MCP.md) and `npm run robot:sample`.

## Prototype boundaries

The deployed workspace opens in an illustrative map sample. The separate video sample contains 12 hand-authored records over an eight-second static preview of AI-generated imagery; neither sample is live model output. Classification accuracy and tracking performance remain unvalidated. CSV locations are normalized source-frame coordinates, not GPS. No spraying or chemical prescription is performed.

## Project files

`DESIGN.md` records the selected system. `design/research-brief.md` records sources and evidence limits. `design-qa.md` records final browser verification and visual comparison. Source: `src/App.jsx`, `src/content.js`, `src/MeasuredCopy.jsx`, `src/styles.css`.

## Asset provenance

Assets were produced using the built-in ImageGen tool. Original generations are retained in the development workspace at `design/source-assets`; the repository contains the WebP versions used by the page. Visual prompts: documentary Japanese farm walk; plant-level segmentation close-up; full top-down vegetable plot with crop/weed/review highlights; and dark corn-seedling computer-vision hero. These are illustrative brand/concept assets, not benchmark inputs. Self-hosted Sora, Source Sans3 and IBM Plex Mono use their bundled SIL Open Font Licenses. Icons: Phosphor, MIT. Pretext: MIT.

The map raster is generated natural overhead field artwork. Every evidence view is a pixel crop of that same raster; no separate photograph is substituted. The approved source visual is `design/selected-field-map-reference.png`.

Dashboard source: `src/dashboard/`. Meta SAM parsing uses `@meta-sam/parser` 0.1.0 from [meta-models/meta-sam](https://github.com/meta-models/meta-sam), under its SAM License. A copy is served at `/licenses/meta-sam.txt`. The dashboard panorama is a separate generated asset; the sample video is a static H.264 encoding of that illustration. See the repository-root `design-qa.md` for dashboard verification.
