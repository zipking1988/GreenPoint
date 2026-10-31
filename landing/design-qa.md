# Landing depth QA — 31 October 2026

final result: passed

No actionable P0/P1/P2 visual issues remain. Independent read-only code review found no actionable issues against372d99f. This acceptance covers the implemented interface; real-provider and gardener validation remain pending.

## Sources and comparison evidence

- Visual truth: selected `design/garden-concepts/04-hybrid-human-evidence.png`, with the user override to preserve `public/assets/vision-field.webp` as the hero. New content extends this direction using the plan in `docs/garden-landing-depth-2026-10-31.md`; new sections are intentional additions rather than pixel-matched legacy sections.
- Production baseline: `design/garden-depth/before-hero-default.png`,2267×1344; `before-full-default.png`,2267×3483. Implementation: `http://127.0.0.1:4189/`, `after-hero-default.png`,2267×1344; `after-full-default.png`,2267×7133.
- Full combined comparison: `design/garden-depth/full-comparison.webp`, two equally scaled600px columns, initial sample pending, stage01, FAQs closed. Focused combined comparison: `hero-comparison.webp`,2267×976 regions scaled equally to1000×431. Both combined images were opened and visually inspected. No preservation mismatch beyond the intentional new navigation link.
- Browser captures: `desktop-1440.png`,1440×6867; `mobile-375.png`,375×9886; focused `need-1440.png`, `evidence-deferred-1440.png`, `mobile-faq-open.png`. Screenshots use density1 at matching CSS width. Full-page screenshots can reflow svh, so stable native viewport captures establish hero fidelity. An earlier cross-viewport comparison was discarded and replaced with the matching2267px pair.

## Required fidelity surfaces

- Fonts/typography: computed Sora Variable headings, Source Sans3 Variable body, IBM Plex Mono data. Long copy wraps without clipping; native paragraphs remain readable before Pretext measurement.
- Rhythm/layout: original hero composition retained. Repeated introduction consolidated into the sourced need section. Split photography/research, single workflow panel and ruled editorial sections each have a distinct purpose.
- Colors/tokens: shared charcoal/sage, lime for action/current selection and amber for uncertainty. No changes to crop/weed data tokens.
- Images: same botanical hero and GP-007 raster/crop. New older-grower artwork is explicitly labeled AI-generated/non-customer. Source overlays use normalized coordinates against the full uncropped raster; all loaded images resolve.
- Copy/content: source links support research claims; competitor strengths acknowledged; no invented outcomes, endorsements or validated demand. Upload/local preview, six-second analysis/two-minute preview and missing model access are explicit.

## Fix/comparison history

1. Initial pipeline image cropped at a different aspect ratio from its normalized box (P2). Fixed to1920:850 at all breakpoints. Post-fix segmentation measurements at320/768/1024/1280/1440 match x.32/y.265/w.25/h.46 within pixel rounding.
2. Initial hierarchy repeated two introductions. Consolidated into the research section. Post-fix desktop/mobile captures show hero → need → evidence clearly.
3. Compared stable same-size hero pair and full-page initial states. New content is intentional; no remaining P0/P1/P2 drift.

## Functional evidence

- Four workflow stages switch; Enter updates the pressed state/live panel. Illustration makes no model calls. FAQ opens natively and answers remain readable at375px.
- Existing example: deferred message preserves original Needs review. Actual CSV downloaded/opened using csv.DictReader: uncertain original, crop human decision, confirmed status, illustrative provenance and normalized coordinates correct.
- Primary action opens video upload. Synthetic6s fixture (sample artwork, not field evidence) produces12frames0.0..5.5s, zero fabricated candidates. Analyze opens Not configured. No paid model call.
- No horizontal overflow at320/375/768/1024/1280/1440. Existing menu/skip link/reduced-motion mechanisms retained; new workflow respects system and page motion settings. Temporary viewport reset before handoff.
- Console: no errors/warnings in tested flow.47existing analysis/map/MCP/Sites tests pass. Production build and Sites packaging pass.

## Remaining validation

No formal accessibility audit or gardener usability study. Real-model secrets unavailable; real-video inference remains unaccepted. Deployment verification follows local acceptance.

---

## Previous release QA (historical)

# GreenPoint garden landing — design QA

Date: 2026-10-31 JST. Surface: `/`, with upload entry into `/dashboard?view=video&upload=1`.

## Source and comparison conditions

- Source visual truth: `design/garden-concepts/04-hybrid-human-evidence.png` (1015 × 1549 pixels), approved by the user, followed by the explicit instruction to preserve the existing botanical hero image and composition. The latter takes precedence over the mock's human hero.
- Preserved hero reference: `/private/tmp/greenpoint-landing-redesign/current-landing.png`, 1280 × 720 browser pixels. Final hero: `design/garden-qa/hero-final-1280.png`, extracted from a browser full-page capture at 1280 × 720 CSS viewport, scrollY 0. No stretching or density correction. `hero-comparison-final.webp` places both at the same scale in one comparison input.
- Final desktop implementation: `design/garden-qa/desktop-final.png`, 1440 × 3261 pixels, browser-rendered at 1440 × 1024 CSS viewport. Captures use density 1 CSS pixel per image pixel.
- Full-page paired input: `design/garden-qa/full-comparison-final.webp`. Each page is scaled to the same 600px width with its natural aspect ratio; differing heights reflect the retained hero and added problem/readiness explanations.
- Focused evidence input: `design/garden-qa/evidence-comparison-final.webp`. Source section (1015px wide) and browser section (1440px wide) are normalized to the same 1015px width, without changing aspect ratios. Original source and implementation crops were inspected together.
- Responsive evidence: `final-375.png` (375 × 3792), `final-768.png` (768 × 3238), `final-1024.png` (1024 × 3234); additional DOM overflow checks at 320 and 1440 CSS pixels. Confirmed/export state: `confirmed-1280-final.png`. Mobile upload preview: `upload-preview-mobile.png`.
- State: illustrative GP-007, uncertain original suggestion, pending human review for visual comparison; confirmed/deferred/reset/export states checked separately. Source and crop use the same raster and normalized rectangle.
- Committed comparison evidence: `design/garden-release-hero.webp`, `design/garden-release-evidence.webp`, `design/garden-release-full.webp`, and `design/garden-release-mobile.webp`. Raw per-viewport captures remain local design artifacts.

## Findings and iteration history

1. [P2, fixed] Mobile navigation button did not reach the right edge; a legacy pseudo-element still said “Video to field map.” Initial evidence: `mobile-v1.png`. Added automatic left margin to the menu button, removed the old pseudo-content, and restored the short-video → evidence → decision row. Post-fix: `mobile-final.png` and `final-375.png`, with scrollWidth equal to viewport width.
2. [P2, fixed] Evidence headline and decision typography were smaller than the approved composition. Comparison: `evidence-comparison-v1.webp`. Increased headline scale/weight, status typography and decision type to 20px on desktop. Final evidence comparison preserves the broad photo, compact panel and readable actions.
3. [P2, fixed] Independent code review found that the absolutely positioned panel overlapped the footnote after confirmation at 1280px. Replaced absolute positioning with an overlapping grid area that contributes its full height to layout. At <=1050px, source and panel stack, with a two-column panel until the phone breakpoint. At 1280px in confirmed/export state, panel bottom is 20px above the footnote. Final evidence: `confirmed-1280-final.png`; independent recheck reports no remaining actionable issues at 1280, 1024, 768 and 390px.
4. Final combined-input comparison found no actionable P0/P1/P2 differences. Remaining differences are the approved original hero, regenerated unannotated illustration, functional rectangular source annotation, same-source caption and explicit interactive/readiness copy. These are intentional product constraints.

## Required fidelity surfaces

- Fonts and typography: self-hosted Sora Variable for display, Source Sans 3 Variable for body/controls, IBM Plex Mono only for source identifiers. Pretext `prepare`/`layout` remains gated by fonts and ResizeObserver. Native text remains visible. Desktop decisions are 20px with >=48px height; phone decisions are 18px with >=52px height. Headings wrap without truncation.
- Spacing and layout rhythm: original botanical hero and full-width imagery retained. Intro, evidence, steps, prototype details and closing each have one job. Thin rules and whitespace group content. Expanded evidence contributes to layout instead of covering later content. No horizontal overflow at 320/375/768/1024/1440px.
- Colors and tokens: existing charcoal canvas, lime primary action, sage crop, coral weed and amber uncertainty retained. Category words and icon cues remain present. Focus outlines and selected decision outlines are visible.
- Image quality: `vision-field.webp` is unchanged. `garden-evidence.webp` is a generated 1920 × 850 illustration, not footage or provider output. Canvas crops the same source rectangle; the functional connector follows responsive geometry. Photographs were not substituted with CSS/SVG drawings. Phosphor provides UI icons. The connector hides where source/panel stack.
- Copy/content: ordinary vegetable gardens replace the Japan-only field-service story. “Upload a short video” is the primary action; an immediate illustrative example remains available. Six-second analysis and pending live-provider validation are visible. No accuracy, labour-saving, herbicide-saving, geographic-coordinate, unique-identity or award guarantee is claimed.

## Functional browser checks

- Mobile navigation opens, closes with Escape and returns focus to its button. Keyboard Tab reaches the visible skip link. Anchor navigation and prototype details work.
- Keep confirms crop; decide later defers; original model suggestion remains uncertain. Reset restores pending. The weed action uses the same inspected decision mechanism.
- Actual CSV was downloaded and opened with a CSV reader: GP-007, illustrative provenance, original uncertain label, human crop decision, confirmed state, and the exact normalized source rectangle were present. Download controls reset after a new decision.
- Primary upload action opens the video workspace and native upload dialog directly. A six-second synthetic test clip was decoded locally to 12 frames at 0.5-second intervals and opened as a local preview. It was not represented as field-validation footage.
- With missing model configuration, Analyze opens Connections; it does not populate detections or show model success. Existing sample/map workflow remains available. No paid provider calls were made.
- Reduced-motion control sets the document motion state to reduced and computed hero animation to none. Browser warning/error logs were empty after the final flow.
- Final production build passes. Existing regression suites: analysis 26, map 8, MCP 9, Sites 4; 47 tests passed. MCP tests required local loopback access outside the filesystem sandbox; their first EPERM run was an environment restriction, followed by a passing authorized run.

## Scope and follow-up

The product hypothesis and UI flow can be demonstrated. Real-provider/field validation and usability testing with gardeners remain pending. This QA pass does not establish model quality or consumer demand. Previous map visual QA is preserved at `docs/map-design-qa-2026-10-31.md`.

Implementation checklist: original hero retained; upload entry linked; evidence and human decisions functional; responsive/keyboard/motion checks complete; code-review overlap fixed and rechecked; build/regressions passed.

final result: passed
