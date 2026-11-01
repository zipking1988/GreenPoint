# Farmer-focused version restored

Date: 2026-11-01 (Asia/Tokyo).

The user requested yesterday's original farmer version. Release `409e71d` is the reference immediately before the garden and plant-agent pivots. This is a forward restoration commit; later versions remain recoverable in Git history.

## Restored experience

- Landing: “See the field. Plant by plant.”, small-field farmer narrative, simulated identity walkthrough, full illustrative field atlas, pipeline and research boundaries.
- Default `/dashboard` and `/app`: the approved entire-field map, image-space evidence connector, Crop / Weed / Keep for review decisions, review queue and CSV.
- `/dashboard?view=video`: field-video sessions. `/app?view=video&upload=1` opens the upload dialog directly.
- Removed the Milo/soil-check/journal product and its unused runtime files, tests and illustration assets from this release.
- Preserved server inference, model-verification safeguards, generic MCP, six-second analysis limit, human-review provenance and Sites packaging. No live model or hardware readiness is claimed.
- Retained URL/history navigation and active-workspace dialog guards so back/forward cannot leave an invisible workspace's native dialog blocking the page. Map/video sessions remain mounted when switching.

## Verification

- 47 automated checks passed: analysis 26, map 8, MCP 9, Sites 4.
- Production build passed and emitted the existing Sites package. Package dependencies and lockfile remain unchanged.
- Browser: restored hero and farmer content; Open workspace defaults to the map; C2 selects GP-002 and the same source raster; a sample review saves, survives switching and resets.
- Browser: video upload dialog, direct `/app` upload link, browser back/forward while upload or connection dialogs are open, and return to the field map.
- Public MCP test: 3 tools discovered and 12 illustrative records returned without a model call.
- Desktop 1280 × 720 and phone 375 × 812 checked. No horizontal overflow; selecting a phone hotspot reveals the evidence with Save & next visible above the bottom navigation.
- Browser console: no errors observed. No paid provider calls or physical hardware tests were performed.
- Manual review checked the restoration against both current main and the farmer reference. Differences from the farmer runtime are limited to URL/history support and hidden-dialog cleanup; sharing metadata now matches the farmer narrative.

Local screenshot evidence is saved under `reviews/farmer-restoration-2026-11-01/` in the restoration worktree. Production deployment and final screenshots are verified after pushing the restoration commit.
