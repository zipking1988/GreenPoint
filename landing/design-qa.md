# Plant workspace design QA — 31 October 2026

final result: passed

Source visual truth: `design/plant-workspace/selected.webp` (variant A, agent-selected under explicit delegation, not user-rated). Render: local `/dashboard`. Authoritative token/photo overrides: DESIGN.md and exact `public/assets/plant-agent-milo.webp`. The generated source incorrectly recreates Milo and invents a date; neither is implemented.

## Comparison evidence

- Desktop source:1505×1045; implementation1440×1000 CSS/pixels, DPR1. Normalize both to900×625 in `design/plant-workspace/qa/desktop-comparison.webp`, source left/render right. Full-view and focused request comparison (`request-comparison.webp`) opened together for visual judgment.
- Render desktop: `qa/desktop-final.webp`, initial Milo/zeroentries/Overview. No fake timestamps, inferred health, measured metrics or default soil reading.
- Mobile:375×844 CSS/DPR1, explicit browser clip `qa/mobile-final.webp`; per-viewport adaptation from the accepted desktop target and documented responsive spec, not a claim that a separate mobile mock was supplied. Source/first-pass versus final comparison is historical; use the explicitclip as final geometry evidence. Some fullPage/native captures resized painted content during capture, so those are not used for pixel-level mobile acceptance.
- Additional captures: `qa/viewport-1024.png`, tablet at1024×900;768×1024 and320×740 DOM/layout checked. Initial768 screenshot had a focused skiplink painted at scroll offset; not used for fidelity acceptance. No horizontal overflow at320/375/768/1024/1440 in plant workspace.
- Focused request view checks headings, disclosure, soil radios, labels, textarea and action at readable scale. State evidence: `qa/manual-journal.png`. Live browser photo input, empty photo, unreadable photo and connections also inspected.

## Comparison history and fixes

1. [P2] Phone first pass placed record action at1188px. Photo and repeated navigation came before the task. Fixed: request/form before compact source, tools at bottom, reduced duplicate chrome. Post-fix first soil choices585px at375width.
2. [P2] Interim record action at802px was partly covered by bottom navigation. Fixed: optional phone note expansion; no input removed. Final action724–774px, navigation starts783px at375×844. Verified in `qa/mobile-final.webp`. Expanded note remains scrollable and keyboard accessible.
3. [P2] Desktop photo and heading spacing pushed the journal too far down relative to source. Fixed: compact identity row, portrait/form43/57 proportion and24px main spacing. Final desktop comparison retains full source/photo, all primary controls and journal heading within1000px.
4. [P3] Utility section count read as Journal1. Fixed: explicit accessible name with entry count, singular/plural, leaving visible count compact.

## Required fidelity surfaces

- Fonts/typography: loaded Sora Variable for headings and Source Sans3 Variable for body, confirmed computed families; IBM Plex Mono limited to concise provenance/time. Body17px/1.5, utility16px, compact labels14px. No font fallback detected in captured request. Heading hierarchy and long-word wrapping preserve layout.
- Spacing/layout: source/sidebar/main anatomy retained; sidebar208px per DESIGN extension rather than generated272px. Exact 4:5 portrait corrects mock’s approximate aspect. Primary action50px; soil targets48px desktop,75px+phone; tools44px+. Phone note is optional expandable, with no fixed overlay covering initial action.
- Colors/tokens: shared charcoal/sage/lime, no new palette. Primary and selection lime; neutral surfaces/crop sage. Clear2px palette focus ring and visible selected radio. No gradients/glows/shadows substituting hierarchy.
- Image quality: exact existing Milo raster with intrinsicdimensions1122×1402, no CSS/SVG approximation. User photo test resized to960×1200, encodedJPEG and exported, source explicitly supplied/notanalyzed. No-photo state uses a library icon and real empty-state label, not fabricated imagery.
- Copy/content: generated fabricated observations/date removed. Overview replaces Request for real manual profiles. Scripted-demo/imagined context and manual-record/noAI labels remain visible. Actual notes render as text; `<script>` test text did not execute. “Not checked” remains unknown.
- Icons: existing Phosphor family, native radio inputs, consistent16–21px utilitysize; controls named and keyboard reachable. Focus and visited source-link colors mapped to palette.

## Interactions verified

- Scripted damp/unknown scenarios update same Milo request/journal; numbered live feedback.
- Personal profile withname/type/location/photo, unknown observation and note; image upload decoding/scaling; unreadable JPEG error retains text; profile withoutphoto still usable.
- Per-plant records isolated; journal/evidence/overview switch, source details, exportbutton.
- Actual JSON downloaded and opened from Downloads. Checked schema/session/revision, sources, identities, both plants, original notes and reducedphoto. model_called/sensor_readings/treatment_authorized allfalse. Exact saved confirmation tested; later edits restore dirty state; stale confirmation cannot clear it.
- Reload attempt retained unsaved state; browser dialog API did not expose a modal, so cross-browser beforeunload presentation remains unverified. Listener and revision logic reviewed/tested; no claim of guaranteed mobile browser prompts.
- Native keyboard radio Space/ArrowRight, Tab to action, Enter submit;2pxlime focus confirmed. Add modal Escape closes and restores Connections/opener focus. Required radio group/visible fieldlabels retained.
- Browser back returns from map to plants without losing records. Video/map/plant switches preserve all selected session records. Existing mobile video navigation checked, compact ≤360px home icon removed to keep actiontargets.
- Connection check reports models notconfigured and makes no paid call. Existing analysis/map/MCP/Sites/landing/workspace suites59passed. Build passed before final releasecheck. Browser console error log empty.

## Independent review correction

The sole read-only reviewer reproduced oneP2: browser history could hide a still-open native dialog and leave the visible view inert. Fix: propagate each workspace’s active state, immediately omit inactive dialogs, clear transient modal state on deactivation, and cancel/clean pending upload reading without removing completed sessions. Parent browser reproduced map -> plants -> Addplant -> Back after the fix: openDialogs0 and Zoomin worked. Video upload modal -> Back also leaves zero open dialogs. Created LifecycleQA with one observation after HMR, switched to map and back, and confirmed its selected identity/entry remained. The same reviewer independently repeated both history/modal cases and confirmed the P2 resolved with no new actionable findings.

## Accepted differences / limits

Source photo/copy/date corrections, exact DESIGNfonts/palette,208pxsidebar, horizontal desktop choices and mobile note expansion are intentional functional overrides. No P0/P1/P2 visual findings remain. No measured usability study or award claim. Reduced-motion CSS present, but browser has no media-emulation capability; runtime OS preference test is not claimed. Real model integration/LLMplantcare/persistent memory remain unvalidated or future work. Vercelproduction verification follows code review and is recorded in release notes.

## Implementation checklist

- [x] Source/render opened and compared together; five required surfaces checked.
- [x] Fix responsive task placement and action obstruction, recapture same state.
- [x] Test manual/demo source boundaries, actual export, error recovery and keyboard flow.
- [x] Preserve video, field map, MCP and Sites contracts.
- [x] Independent release review and fixes (2 rounds,1P2fixed).
- Preview/production verification is the release step after this reviewed commit.

---

# Plant story refinement QA — 31 October 2026

final result: passed

Visual/interaction acceptance only. Real-model and plant-agent acceptance remain pending. Independent read-only review against366f43c found no actionable introduced defects; six targeted checks passed. This is separate from the still-unaccepted real-model gate.

## Source and comparison

- Existing selected Living Network source: `design/plant-agent/selected.webp`,946×1663. Exact botanical raster retained under the user's earlier override. User authorized the audit's task-first/mobile refinements; `docs/plant-story-refinement.md` records intentional differences.
- Latest native implementation: `design/plant-agent/refinement/qa/desktop-hero.png` and `desktop-story.png`,1440×1000; full page1440×7665. Initial unknown soil, empty scenario history, closed evidence, reduced motion for stable captures. Screenshots use CSS width/density1.
- Combined hero comparison: selected source946×650 region and implementation1440×1000, equally resized to720px columns without distortion. Different natural heights and the new invitation/copy placement are explicit. This compares visual direction, not pixel identity.
- Combined phone comparison: prior audit375×844 entry and final375×844 entry, same unknown-soil state. Both the combined hero and mobile images were opened and inspected. Focused native phone/story screenshots make labels and controls readable.

## Required surfaces

- **Typography:** Sora display, Source Sans3 body, Plex Mono helpers retained. Body18–21px in the task; mobile questions wrap naturally. Shorter headings and clearer action labels; tiny eyebrow text remains secondary, with normal-size adjacent explanations.
- **Layout/rhythm:** original fullbleed botanical world, one primary action, asymmetrical editorial sections and source-led story. Open rules replace a nested panel. Mobile places conversation before the portrait; first choice≈714px, submit bottom≈827px at375×844.
- **Color/tokens:** unchanged shared charcoal/sage/lime; lime is action/current loop, sage is context, amber labels the concept/future status. Selected radio choices have both border/text treatment and a real Phosphor check icon. No crop/weed token changes.
- **Image quality:** original1495×1052hero,1122×1402Milo and1920×850garden source reused without raster substitution or fake source crops. Portrait stays uncropped; source and generated/fictional status remain visible. No custom icon or decorative SVG approximations.
- **Copy/content:** a specific care-context question replaces vague value copy. The same fictional Milo stays attached to scenario/journal/export. Lab is explicitly separate; no implied Milo creation, provider validation, long-term memory or sensor readings. Model roles are explained inside a native disclosure.

## Fix loop

1. P2: navigating to Milo put the chapter kicker behind the sticky header. Added28px target scroll margin, recaptured at375×844 and1440×1000. Kicker is visible and the submit still fits in the phone viewport.
2. P2: narrow radio choices initially used color without a visible checkmark. Kept the Phosphor check at the top corner on narrow screens; browser confirmed display:block/opacity1 on the selected item. Captured `mobile-damp-final.png`.
3. Repeated identical submissions needed distinct assistive feedback. The live status now includes the entry number; actual consecutive submissions announce entry1 then entry2.
4. Post-fix comparison and focused native images show no remaining actionable visual P0/P1/P2. These fixes do not count real AI inference as completed.

## Functional coverage and limits

Required radio validation, keyboard selection, all three branches, actual JSON export, reset/focus, menuEscape, loopEnter, FAQ, reduced motion and video workspace navigation were exercised in the browser. Export opened with correct ordering and simulation/non-actuation flags. No horizontal overflow at320/375/768/1024/1440. Final regression:52/52 tests pass, including analysis, map, MCP, Sites and plant-story helpers. Production build and Sites packaging pass. Independent release review found no actionable issues, including shared ID/re-export and log-retention checks.

No formal screen-reader/contrast/zoom audit or iOS hardware test. Model credentials remain unavailable. The honest prototype labels are required, and should be updated only after actual validation.

---

## Previous plant-agent QA (historical)

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
