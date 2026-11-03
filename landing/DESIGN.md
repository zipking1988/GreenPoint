---
name: GreenPoint Plant Intelligence
description: Phone-first agricultural perception, expressed as a judge-facing research prototype.
colors:
  primary: '#d3fa79'
  background: '#111513'
  surface: '#1a201c'
  surfaceActive: '#252d28'
  text: '#f1f2ed'
  muted: '#abb2ab'
  border: '#364039'
  crop: '#afc3a4'
  weed: '#ef987f'
  review: '#edcc79'
typography:
  display:
    fontFamily: Sora Variable
    fontWeight: 600
    fontSize: clamp(2.6875rem, 6.7vw, 6.75rem)
    lineHeight: 1.01
  body:
    fontFamily: Source Sans 3 Variable
    fontSize: 1.125rem
    lineHeight: 1.5
  mono:
    fontFamily: IBM Plex Mono
    fontSize: 0.6875rem
    fontFeature: tnum
  dashboardDisplay:
    fontFamily: Sora Variable
    fontWeight: 540
    fontSize: 3rem
    lineHeight: 1.12
  dashboardBody:
    fontFamily: Source Sans 3 Variable
    fontSize: 1rem
    lineHeight: 1.5
  dashboardUI:
    fontFamily: Source Sans 3 Variable
    fontSize: 0.8125rem
    lineHeight: 1.4
spacing:
  unit: 4px
  section: clamp(3.25rem, 6vw, 6.5rem)
  pageMargin: clamp(1.375rem, 5.6vw, 5.5rem)
  contentMax: 1380px
rounded:
  control: 0px
  image: 0px
shadows:
  default: none
---
# gstack: design-md-format=spec

# GreenPoint Design System

## Product and audience

A landing page for international hackathon judges and Japanese agricultural operators managing scattered small fields. The visitor should remember: inspect the source behind each candidate, then make a human review decision. The prototype has a deployed Meta perception pipeline and generic MCP interface; public-data results have not met the weed-recognition target, and real-farmer performance remains unvalidated.

## Selected direction

The user explicitly changed from option 3 to original option 2, the dark forest/lime computer-vision direction, then asked for richer content and premium motion. Preserve the entire-field map requested from option 1. Warm cream/terracotta and watercolor process illustrations are superseded. The user-approved 2026-10-31 color refinement retains that composition and imagery while replacing large green UI surfaces with charcoal; the shared palette below now governs colors.

Visual truth: `design/selected-dark-reference.png`, evolved from the selected original option 2. Its generated repeated Plant007 labels are illustrative, not valid tracking evidence; the implementation uses repeated crops of the same underlying image to explain identity instead.

## Typography and loading

Sora supplies a geometric display voice close to the selected mock. Source Sans 3 supports longer product explanations; IBM Plex Mono is reserved for frame IDs and concise specimen data. Fontsource packages are self-hosted, with SIL OFL licenses checked locally. Body text uses 16px or larger, with smaller captions and utility labels. Pretext `prepare` and `layout`, gated by `document.fonts.ready` and ResizeObserver, reserve body-copy height without hiding or clipping native text.

## Layout

One immersive, full-bleed photographic hero. Each following section has a separate purpose: recorded source evidence, farmer problem, illustrative identity explanation, field atlas, architecture, recorded MCP loop, measured evaluation, FAQ, invitation. No generic feature-card grid, fabricated testimonials, award badges, pricing, or ornamental dashboards. Thin rules group related content. Map image keeps its natural aspect ratio and full plot bounds. The source-evidence preview uses the actual recorded frame and corresponding plant crop, with a responsive connector on desktop. Both primary invitations enter the real workspace; the illustrative walkthrough is secondary.

## Motion

Premium, measured, finite. Easing: `cubic-bezier(.2,.7,.2,1)`. Quick feedback150ms, normal400ms, authored hero700ms. Hero title is primary, CTA secondary, photo settling is ambient; all visible by default. The tracking explanation runs8.5 seconds and stops; Pause, Replay, range scrubber, and manual frame selection remain available. Reduced motion removes entrances and automatically moving footage, with manual controls retained. No scroll hijacking, endless pulses, decorative marquees, or hidden-until-scroll content.

## Interaction and accessibility

Sticky navigation uses section anchors and current-section indication. Buttons and touch targets at least44px. Native range input supports keyboard scrubbing. Pipeline tabs use arrow/Home/End navigation. FAQ uses native details/summary. Full-map dialog uses the native modal focus trap, Escape, close button, and focus restoration. Labels distinguish illustrative data, actual recorded Meta/MCP results, live processing and future field validation. Important mobile provenance and limitation copy is at least12px. The downloadable CSV contains four explicitly illustrative, normalized-image-coordinate records.

## Decisions log

- User choice: original option2; retain entire-field map and its copy from option1.
- User scope: richer judge-facing content, premium responsive presentation, meaningful motion, direct implementation.
- Implementation: preserve existing React/Vite/Sites-ready runtime. The 2026-10-31 dashboard request adds a Vercel Node API and production deployment; automatic spraying and fabricated measured results remain excluded.
- Semantic crop/weed masks alone do not provide plant-instance identity ground truth. Evaluation copy must preserve this distinction.

## Dashboard extension / Operate

The dashboard follows selected direction A in `design/selected-dashboard-reference.png`. Existing local font files and SIL OFL licenses remain the typography source. The field canvas is the visual anchor, session navigation is secondary, and the inspection panel connects every decision to an actual source crop. The first screen uses layout and thin separators rather than a KPI card wall. Source artwork is an ImageGen panorama, explicitly illustrative.

Desktop: icon rail, session sidebar, central video/inventory, and a persistent evidence inspector. At tablet width, the inspector follows the inventory and uses a horizontal specimen treatment. At phone width, session navigation becomes a drawer, navigation moves to the bottom, the inventory drops long observations from its columns, and the full observation remains in inspection. Portrait uploads retain their native ratio in a bounded media frame; image, boxes and masks share its bounds.

Display is geometric and restrained. Body explanations use the dashboard body token; compact UI uses the UI token, with smaller mono reserved for frame times, IDs and provenance. Brand-derived secondary surface tones are intentional rather than new semantic colors. Primary actions use solid lime; crop, weed and uncertain always have text as well as color. At most six large, selected-first boxes appear at once; the full inventory remains accessible below.

Motion is functional: a short inspector arrival, a finite dialog entrance and responsive control feedback. A real analysis shows progress and a cancellable spinner. Reduced-motion removes transforms and loops while leaving numeric progress and all controls available. There is no autoplay, scroll hijacking or endless decorative motion.

States are part of the interface: local preview, missing model connection, invalid video, extraction progress, analysis progress/cancel, partial output, no plants, filtered-empty, human-reviewed and export. Sample changes persist in versioned local storage; user videos and live sessions remain in tab memory. Connection status describes configuration; only a successful run is evidence of provider operation.

## Color refinement / 2026-10-31

The user approved reducing the overall green cast after a screenshot-based audit of the landing and dashboard. Preserve layout, type scale, photographs, data, motion and workflows. The original generated references remain layout/image baselines; their broad green surface treatment is intentionally superseded by this decision.

`src/palette.css` owns the shared color roles for both routes, native dialogs, loading and error states. Canvas is #111513, surface #1a201c, sidebar #161b18 and active surface #252d28. White #f1f2ed, muted #abb2ab and dim #929d95 carry ordinary content. Large landing section headings, plant IDs and dashboard subtitles no longer use decorative lime. The landing hero's lime phrase and brand marks remain.

Lime #d3fa79 identifies primary actions and current interaction. Crop data uses sage #afc3a4, weed remains coral #ef987f and uncertainty remains amber #edcc79. `LABELS.crop.color` mirrors the crop token so decoded masks and CSS labels share the same semantic color. Crop/weed/review filters use their category colors when selected; All plants retains lime. Dark outlines help boxes remain visible over plant imagery. Category words and symbols remain present.

Controls use #606e63 for explicit borders; quiet structural rules use #364039. A rule separating ordinary rows is not a control boundary. No asset has been recolored.

## Map-led workspace / 2026-10-31

The user selected the first map composition plus the third concept’s evidence workflow, then approved an explicit GP-007 source connector. `design/selected-field-map-reference.png` is the current layout truth. Default `/dashboard` and `/app` use a narrow icon rail, compact field header, dominant photographic map, and contextual evidence drawer. Keep the approved charcoal/sage palette.

Field zones and source boxes are functional image-coordinate geometry over a generated raster, rather than an image of the interface. A selected source box, connector and evidence label share the same plant ID. The evidence is cropped from the same raster. Pan/zoom/resize update the link; an offscreen source or scrolled-away photo hides it. Small screens stack evidence below the map, retain matching IDs, and reveal the panel after selection. Native radios and Save & next keep draft choices separate from saved human review.

Illustrative zone signals are hand-authored, not calculated weed cover. Unknown areas are gray hatched and explicitly not weed-free. No metric scale, latitude/longitude, accuracy number, connected-device count or navigation action is invented. Video sessions and MCP perception keep their existing independent workflows and coordinate semantics.
