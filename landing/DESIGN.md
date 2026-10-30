---
name: GreenPoint Plant Intelligence
description: Phone-first agricultural perception, expressed as a judge-facing research prototype.
colors:
  primary: '#d3fa79'
  background: '#06150f'
  surface: '#0c2118'
  surfaceActive: '#142d20'
  text: '#f3f6f0'
  muted: '#a7b9ad'
  border: '#385043'
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

A landing page for international hackathon judges and Japanese agricultural operators managing scattered small fields. The visitor should remember: repeated views become one reviewable plant identity, then a field inventory. This is a presentation prototype, not a deployed agricultural model pipeline.

## Selected direction

The user explicitly changed from option 3 to original option 2, the dark forest/lime computer-vision direction, then asked for richer content and premium motion. Preserve the entire-field map requested from option 1. Warm cream/terracotta and watercolor process illustrations are superseded.

Visual truth: `design/selected-dark-reference.png`, evolved from the selected original option 2. Its generated repeated Plant007 labels are illustrative, not valid tracking evidence; the implementation uses repeated crops of the same underlying image to explain identity instead.

## Typography and loading

Sora supplies a geometric display voice close to the selected mock. Source Sans 3 supports longer product explanations; IBM Plex Mono is reserved for frame IDs and concise specimen data. Fontsource packages are self-hosted, with SIL OFL licenses checked locally. Body text uses 16px or larger, with smaller captions and utility labels. Pretext `prepare` and `layout`, gated by `document.fonts.ready` and ResizeObserver, reserve body-copy height without hiding or clipping native text.

## Layout

One immersive, full-bleed photographic hero. Each following section has a separate purpose: problem, identity explanation, field atlas, architecture, evaluation plan, FAQ, invitation. No generic feature-card grid, fabricated testimonials, award badges, pricing, or ornamental dashboards. Thin rules group related content. Map image keeps its natural aspect ratio and full plot bounds.

## Motion

Premium, measured, finite. Easing: `cubic-bezier(.2,.7,.2,1)`. Quick feedback150ms, normal400ms, authored hero700ms. Hero title is primary, CTA secondary, photo settling is ambient; all visible by default. The tracking explanation runs8.5 seconds and stops; Pause, Replay, range scrubber, and manual frame selection remain available. Reduced motion removes entrances and automatically moving footage, with manual controls retained. No scroll hijacking, endless pulses, decorative marquees, or hidden-until-scroll content.

## Interaction and accessibility

Sticky navigation uses section anchors and current-section indication. Buttons and touch targets at least44px. Native range input supports keyboard scrubbing. Pipeline tabs use arrow/Home/End navigation. FAQ uses native details/summary. Full-map dialog uses the native modal focus trap, Escape, close button, and focus restoration. Labels distinguish illustrative data, planned model capabilities, and future field validation. The downloadable CSV contains four explicitly illustrative, normalized-image-coordinate records.

## Decisions log

- User choice: original option2; retain entire-field map and its copy from option1.
- User scope: richer judge-facing content, premium responsive presentation, meaningful motion, direct implementation.
- Implementation: preserve existing React/Vite/Sites-ready runtime; no auth, paid AI calls, deployment, automatic spraying, or fabricated measured results.
- Semantic crop/weed masks alone do not provide plant-instance identity ground truth. Evaluation copy must preserve this distinction.
