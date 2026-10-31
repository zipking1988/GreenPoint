# Plant-agent landing QA — 31 October 2026

final result: passed

No actionable P0/P1/P2 issues remain in the implemented landing. Independent read-only code review against2aea8c2 found no actionable findings. This acceptance covers a scripted frontend concept; real LLM plant agents, sensors, long-term memory and plant-health results are not accepted as implemented.

## Visual truth and evidence

- Selected source: `design/plant-agent/selected.webp`, raw `selected.png`,946×1663. First displayed concept/The Living Network selected by agent under user's explicit delegation; three independent concepts were shown and a local comparison board captured in `qa/design-board.png`. User override preserves exact original `public/assets/vision-field.webp` in place of the concept's regenerated hero.
- Implementation: `http://127.0.0.1:4189/`, captured in `design/plant-agent/qa/desktop-final.png`,1440×6199; `mobile-final.png`,375×8770. CSS widths match screenshot widths, density1.
- Combined full/above-fold comparison: `qa/source-comparison-final.webp`, source scaled equally to720px and implementation1440×2460 region scaled to720px, side by side. No image squashing; unequal natural heights padded. Focused combined comparison: `qa/milo-comparison.webp`, source946×700 and implementation1440×1100 regions at matching content scale. Both were opened and inspected.
- Focused browser evidence: `qa/milo-desktop.png`, `mobile-faq.png`, `320-overflow-before.png`, `320-overflow-fixed.png`. Initial state: soil unknown, no recorded scenarios, first loop step, evidence/FAQ closed.
- Full-page capture correction: shots made while scrolled can paint sticky navigation or focused skip links inside the full-page image. Final captures start atscrollY0 with skip link confirmed offscreen. Native viewport images establish actual fixed-element behavior.

## Five required fidelity surfaces

- Typography: self-hosted Sora display, Source Sans3 body, IBM Plex Mono identifiers. Heading scale/weight match selected direction; main body18–21px, source captions smaller. Native text remains readable before Pretext font-ready/ResizeObserver measurement. Mobile request wraps without clipping.
- Layout/rhythm: fullbleed hero, single request invitation, full4:5Milo portrait beside one interactive request surface. Mobile moves request into flow and follows portrait with panel. A working form/journal extends the generated mock deliberately; later editorial sections have distinct jobs.
- Colors: shared charcoal/sage retained, lime actions/current step, muted source text. No changes to crop/weed semantic colors in workspace. Phosphor icons stay consistent. Focus/selection controls visible.
- Images: original botanical raster untouched; Milo generated separately from selected reference,1122×1402WebP. All3page images resolve in browser. Hero request has no misleading plant connector or tracking identity. The mock's invented diagnosis and tiny soil/leaf tiles are replaced by the actual full generated source, explicit unknown information and an image link. This is an intentional truthfulness adjustment.
- Copy/content: concept, simulation provenance, missing measurements and current/future status are explicit. Related research is linked without novelty/endorsement/impact claims. Existing video workflow limits and separate MCP remain accurate. No automatic watering, active sensors or genuine LLM request is implied by the demo.

## Fix history

1. P2:320pxloop grid used min-content tracks and “Remember” extended page to329px. Fixed with minmax(0,1fr), min-width0 and mobile labels spanning a row. Removed redundant mobile arrows. Before/after screenshots saved; all320/375/768/1024/1280/1440 measurements now equal viewport width.
2. Submission feedback was distant from the form. Added inline scenario confirmation and an anchor to the updated request; requests remain pending. Reset returns focus to a visible select.
3. Mobile menu-to-Milo navigation waits one frame for menu close before measuring scroll. Verified menu closes, heading receives focus and remains visible below the header.
4. Recompared final source/implementation and phone detail after fixes. No remaining P0/P1/P2 drift. Source extensions and omitted fictional diagnostics are intentional, documented above.

## Functional verification

- Required selection prevents empty submit. All dry/damp/unknown scenarios update the request and preserve a pending human follow-up. Evidence opens and focuses native summary; original source link points to the same Milo raster.
- Actual JSON downloaded/opened:3events in dry/damp/unknown order, visitor_selected_simulation provenance, generated image/fictional identity, model_called:false, sensor_readings:false, treatment_authorized:false.
-31actual form submissions retain latest30events (scenario2..31), total31 disclosed and exported. Focusable journal scrolls with keyboardEnd. Reset clears scenarios and exports a fresh session UUID with no prior events.
- All4loop controls operate by keyboardEnter with one pressed; mobile menuEscape restores toggle focus. Native FAQ expands readably. Page reduced-motion toggle disables animations and native anchor smoothing; system preference also respected.
-51tests passed:47existing analysis/map/MCP/Sites plus4new provenance/branch tests. New helper tests repeated after final source updates. Production build and Sites packaging pass. No console warnings/errors in tested flow.

## Limits and follow-up

No real device/iOS Safari run or formal screen-reader audit. Real-provider credentials remain unavailable. Plant-agent reasoning and persistent care memory require future implementation and validation. Monid has no active API key; Higgsfield workspace access returned an auth hint, so full scroll-world film generation was not performed or billed. Native scrolling and still-based finite motion ship instead.

---

## Previous landing QA (historical)

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
