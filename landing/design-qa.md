# GreenPoint map dashboard — design QA

Date: 2026-10-31

Source visual truth: `design/selected-field-map-reference.png` — the user-approved hybrid with an explicit GP-007 source connector.
Implementation: `/dashboard` and `/app`, local browser preview at `http://127.0.0.1:4191/dashboard`.

## Comparison conditions

- Source: 1487 × 1058 pixels. Desktop implementation: 1487 × 1058 CSS and screenshot pixels, no density normalization or image stretching.
- State: Weed cover layer, B4 selected, GP-007 uncertain and unreviewed, evidence open, map fitted, no notification.
- Full-view paired input: `design/map-dashboard/comparison-final.webp` (source left, implementation right).
- Focused evidence comparison: `design/map-dashboard/evidence-comparison.webp` (400 × 846 regions paired at equal scale).
- Responsive evidence: `mobile-map-final.webp`, `mobile-evidence-final.webp` at 375 × 812; `tablet-final.webp` at 834 × 1194 CSS pixels; `laptop-final.webp` at 1280 × 720. Full tablet page is intentionally scrollable.

## Findings and comparison history

1. Initial paired comparison (`comparison-first.webp`) found P2 drift: the field occupied too little of the map image, the zone title used decorative coral instead of white, and the evidence controls/captions had a smaller type scale than the visual. Reframed the generated raster without warping it, restored the white heading/coral status dot, and increased decision/caption typography. Tightened the evidence paragraph spacing so the action aligns with the intended rhythm.
2. Interaction pass found P1: inherited pressed-state transforms moved positioned map labels away from the pointer. Preserved marker-specific transforms while pressed. Retest: a single pointer click on Not observed opens its explanation; hotspot and plant buttons select correctly.
3. Responsive pass found P2: at 1280 × 720, Save & next extended beyond the inspector scrollport (button bottom 710.8, panel bottom 668). The short-screen treatment reduces photo aspect, spacing and secondary metadata. Post-fix: button bottom 607.8, panel bottom 668; it is fully visible. Evidence: `laptop-before.webp` and `laptop-final.webp`.
4. Final paired comparison inspected full view and evidence detail. No actionable P0/P1/P2 visual findings remain.

## Required fidelity surfaces

- **Fonts and typography:** self-hosted Sora Variable and Source Sans 3 Variable load successfully (both document.fonts checks true). Sora supplies the field title and plant ID; readable body and native decision controls use Source Sans 3. Controls remain legible and do not truncate across checked widths.
- **Spacing and layout:** 76px desktop rail, 150px header, dominant 983 × 848 map stage and 400px evidence drawer at source viewport. No horizontal overflow. Phone evidence stacks below the map and is revealed after hotspot selection; Save remains above the fixed bottom navigation (button bottom 673.3, nav top 748).
- **Colors and tokens:** shared charcoal/sage roles preserved. Coral indicates illustrative weed signals, amber uncertainty, gray hatch unobserved space, and lime selection/primary action. Crop and weed decisions retain their category colors.
- **Image quality and assets:** generated natural field raster is stored in `public/assets/survey-field.webp`. The evidence is an actual crop of that same raster, rather than a separately generated plant photo. The map and evidence share the same image URL and GP-007 source box. Phosphor supplies icons. Canvas polygons, hatch and connector represent functional coordinate overlays, not replacements for image assets.
- **Copy:** field, zone, plant ID, decisions and primary action follow the selected visual. The illustrative/unreferenced status is explicit. Copy does not invent GPS, acreage, measured cover, confidence, live device status or navigation. Added same-source caption and retained original video/MCP boundaries.

## Functional browser checks

- Zoom, fit and pointer drag update the source-selection geometry and connector endpoints.
- Zone C2 selects GP-002; map, connector and evidence share that ID.
- Evidence layer exposes selectable plant records. Coverage retains the selected source link.
- Close evidence expands the map; selecting Field restores the initial inspection.
- Native radio choice → Save & next updates the review queue. A saved GP-002 Weed decision survives reload; reset restores the original records.
- Not observed explains that missing evidence is not weed-free land. Dialog close/Escape and focus behavior use the native dialog.
- MCP browser test actually initializes/discovers/calls the endpoint: 3 tools, 12 illustrative records. The isolated development port required an exact temporary MCP_ALLOWED_ORIGINS entry; production origin policy was not changed.
- Upload footage opens the original video flow. Existing sample MP4 was decoded into 12 local snapshots, opened as a local session, and remained present after switching map → video → map. No paid model request was made.
- Browser console checked after the final flow: no warnings or errors.
- Regression checks: 8 map + 13 analysis + 9 MCP + 4 Sites = 34 passed. Production build passes.

## Intentional differences / follow-up polish

The generated reference's right-hand close-up is illustrative and cannot establish an exact pixel match to the map. The implementation uses one coherent raster and a real crop, so vegetation details and the connector angle differ. This is necessary for truthful source linkage. Region IDs and signals remain hand-authored examples. Real aerial georeferencing and physical drone/device integration are outside this visual release. Browser-emulated phone layout was checked; physical-device pinch behavior remains a field-validation item.

## Implementation checklist

- [x] Approved visual saved in the project.
- [x] Functional coordinate overlays and same-image evidence.
- [x] Review, persistence, reset and export.
- [x] Existing video and generic MCP preserved.
- [x] Responsive captures, paired comparisons and fixes completed.
- [x] Required regression checks and build passed.

final result: passed
