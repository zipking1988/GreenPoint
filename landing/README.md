# GreenPoint landing

A responsive React/Vite presentation prototype for phone-first per-plant weed mapping. The selected art direction is dark forest, pale lime and botanical computer vision. The entire-field map from the earlier concept is preserved.

## Local preview

With Node.js 22 or newer, run `npm ci`, then `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort`. Production build: `npm run build`. Packaging checks: `npm run test:sites`. Dependency check: `npm audit`.

## Vercel deployment

Public production site: [GreenPoint](https://greenpoint-vert.vercel.app/).

Use `landing` as the Vercel project's Root Directory and `main` as its production branch. `vercel.json` installs with `npm ci`, runs the existing build, and publishes `dist/client`. The additional Sites worker output remains available for a separate Sites handoff.

## What works

- Same-scene simulated tracking explanation with finite playback, pause, replay, scrubbing and reduced-motion support.
- Complete field atlas with four labeled illustrative samples, review filtering, inspection and an actual sample CSV download.
- Pipeline tabs, native FAQ, mobile navigation and full-map modal.

## Prototype boundaries

No video is analyzed here and no live Meta inference is connected. Model architecture and public-data evaluation are proposed. All current field artwork is AI-generated illustration, not WeedMap imagery or Japanese field footage. CSV locations are normalized image coordinates, not GPS. Policy context is not a claim about GreenPoint performance. No spraying or chemical prescription is performed.

## Project files

`DESIGN.md` records the selected system. `design/research-brief.md` records sources and evidence limits. `design-qa.md` records final browser verification and visual comparison. Source: `src/App.jsx`, `src/content.js`, `src/MeasuredCopy.jsx`, `src/styles.css`.

## Asset provenance

Assets were produced using the built-in ImageGen tool. Original generations are retained in the development workspace at `design/source-assets`; the repository contains the WebP versions used by the page. Visual prompts: documentary Japanese farm walk; plant-level segmentation close-up; full top-down vegetable plot with crop/weed/review highlights; and dark corn-seedling computer-vision hero. These are illustrative brand/concept assets, not benchmark inputs. Self-hosted Sora, Source Sans3 and IBM Plex Mono use their bundled SIL Open Font Licenses. Icons: Phosphor, MIT. Pretext: MIT.
