# GreenPoint design QA

final result: passed

## Scoped follow-up: map clarity and pre-publication review

The user annotated GP-021 because the small crosshair and hidden ID did not explain what the marker represented. The scoped fix preserves the approved landing and whole-field image, while making all four categories and plant IDs persistently visible. Category colors, a selected fill, connectors, an inspection arrow and a short instruction connect each label to its plant and the existing inspector.

Latest local evidence: `design/atlas-marker-before.jpg`, `design/atlas-marker-desktop.jpg`, `design/atlas-marker-mobile.jpg`, `design/atlas-marker-320.jpg`, and `design/atlas-marker-tablet.jpg`. QA captures and original generated artwork remain in the development workspace; they are not part of the source distribution.

- [P2, fixed] The weed callout could intersect GP-007's touch target on narrow screens. Shifted that callout and its connector. Browser geometry at 320, 375, 768 and 1440px confirms no label/label or label/other-target intersections, no labels outside the image, and no horizontal overflow. Touch targets remain 44px on mobile and 48px on larger screens.
- [P2, fixed] An open mobile menu remained mounted visibly after resizing above its breakpoint. It now hides on larger screens; the desktop navigation remains visible. Verified by opening at 320px and resizing to 768px.
- [P2, fixed] Repeating Explore during active playback reused the original animation start. A new request now resets the progress reference and restarts the animation effect. A deterministic hook/RAF harness verified restart, pause, resume, completion, replay and reduced motion; the harness was a temporary review tool, not an added repository test.
- Vertical navigation observation now derives pixel margins from viewport height and rebuilds on resize. This avoids percentage margins whose vertical offsets are width-relative in the [Intersection Observer specification](https://w3c.github.io/IntersectionObserver/#intersectionobserver-root-intersection-rectangle). Active Research and Approach links were verified at 1920×1080.
- Dependency review found six vulnerable packages in the initial lockfile. Updated Vite to 6.4.5 and compatible transitive patches; removed two unused font packages. A clean `npm ci`, production build and all four existing Sites tests pass; `npm audit` reports zero vulnerabilities.
- Crop selection and the two-record review filter still update the inspector correctly. No live inference, surveyed coordinates or measured agricultural results were introduced.

## Comparison target and evidence

- Source visual truth: `/Users/zip/Documents/ChatGPT/GreenPoint/landing/design/selected-dark-reference.png`,776×2027px, evolved from the user-selected original option2. The user also explicitly retained option1’s complete field map and requested richer content.
- Implementation: `http://localhost:4173/`, React/Vite presentation prototype.
- Desktop capture: `/Users/zip/Documents/ChatGPT/GreenPoint/landing/design/desktop-final.jpg`,1440×6375px; CSS viewport1440×1000, devicePixelRatio1.
- Desktop hero: `design/hero-final.jpg`,1440×1000px.
- Full-view side-by-side: `design/comparison-final.jpg`. Each artifact normalized to600px width, no page-height stretching. Source is shorter because the implementation contains expanded sourced context, functional specimen controls, inspection, explanatory panels and readiness content.
- Matched first-viewport comparison: `design/hero-comparison-final.jpg`. Source cropped to its hero/control region, then normalized to720px width beside the1440×1000 implementation at720px width. No browser chrome or device frame.
- Focused tracking comparison: `design/tracking-comparison-final.jpg`; readable implementation detail: `design/tracking-focused-final.jpg`.
- Focused full-map evidence: `design/atlas-focused-final.jpg`; native modal: `design/map-dialog-desktop.jpg`.
- Responsive captures: `design/tablet-final.jpg` and `design/tablet-hero-final.jpg` at768×1024 CSS; `design/mobile-final.jpg` and `design/mobile-hero-final.jpg` at375×812 CSS; `design/narrow-320-final.jpg` at320×740 CSS. Mobile has no supplied1:1 source; it is evaluated against the selected visual system and explicit full-map/interaction constraints.
- Mobile full-page contact sheet: `design/mobile-contact-sheet.jpg`, four consecutive native-width page segments. This is a QA presentation, not a fabricated website layout.
- State: native map closed, all four sample records, sample GP007 selected, pipeline Segment, FAQ closed, tracking resolved at3observations/1identity. Reduced-motion page control freezes static comparison captures. Ordinary playback was tested separately.

## Findings and comparison history

### Earlier cream implementation, superseded

- [P1] Wrong selected visual direction after the user changed to2. Replaced cream/terracotta, serif-led hero and watercolor steps with the selected dark forest/lime system. Evidence: historical `design/desktop-initial.jpg` versus the current source and final captures.
- [P1] Product explanation and action were absent from the hero. Added explicit phone-video-to-reviewable-map copy and the walkthrough CTA in the first viewport.
- [P2] The full-plot image was cropped by a forced1.93 ratio. Removed cover cropping. The current map renders at its natural1586/992 ratio, measured approximately1.59882 at desktop, tablet and mobile.

### Dark pass1, blocked before fixes

- [P2] The repeated-view specimen was too small to inspect. Evidence: `design/tracking-v1.jpg`. Generated a dedicated high-resolution macro asset and used three crops of that same underlying image. Post-fix: `design/tracking-focused-final.jpg` and the paired tracking comparison show the same recognisable plant at useful scale.
- [P2] The mobile map legend covered part of the small plot. Moved the legend below the image on mobile while preserving the image-relative sample positions. Post-fix: segment2 of `design/mobile-contact-sheet.jpg` shows complete boundaries and a separate legend.
- [P2] Hero body copy crossed bright foliage on the narrow crop. Darkened the photographic treatment and added restrained text contrast support, without gradient art or a panel. Post-fix: `design/mobile-hero-final.jpg` and desktop first-viewport comparison.
- [P2] Mobile navigation lacked Escape dismissal; active navigation could remain on a previous section at the hero. Added Escape handling and explicit hero/current-section reset. Browser checks passed.

### Final pass, passed

No actionableP0/P1/P2 findings remain for this landing prototype. The source’s misleading repeated IDs on different physical plants were intentionally replaced by a same-image identity explanation, and all imagery/records remain clearly illustrative. Source-copy/layout expansion is intentional under the user’s richer-content request, not an attempt to claim exact full-page pixel equivalence.

## Five required fidelity surfaces

1. **Fonts and typography:** self-hosted Sora display, Source Sans3 body and IBM Plex Mono IDs. Exact installed font names and OFL licenses checked. Desktop h1 computed60096.48px/97.44px; heading wraps and mobile331px/282px content widths were inspected. Body text remains native and cannot be clipped by Pretext, which only reserves min-height. FAQ expanded answer measured186.125px against186px scroll height. Utility captions are deliberately smaller than body text.
2. **Spacing/layout:** immersive full-bleed hero, clear text/action hierarchy, cardless editorial sections, native-ratio full map, desktop three-observation strip, one active observation plus scrubber on mobile. Header and main controls remain visible. No horizontal document overflow at320,375,768 or1440px. Expanded content makes the implementation taller than the visual concept; region proportions are deliberately preserved rather than stretching a mock screenshot.
3. **Colors/tokens:** forest#06150f, lime#d3fa79, white#f3f6f0, hue-tinted secondary#a7b9ad; coral and amber reserved for plant categories. Flat-surface contrast: white17.16:1, muted9.08:1, lime15.79:1; secondary on the inspection surface8.17:1. Photo text inspected visually after darkening. Focus, selection, scrollbars, active tabs and source-link visited state use project tokens. No decorative glows or gradient UI.
4. **Image quality:** generated photographic artwork matches the selected crop/soil direction; macro images show an actual consistent underlying plant. Whole plot and surrounding paths remain visible. Original generated rasters are retained in `design/source-assets`; the runtime uses four WebP assets. Icons use Phosphor. No CSS/SVG art substitutes for photography or illustration.
5. **Copy/content:** clear English product story, sourced MAFF context, proposed architecture, explicit illustrative labels, uncertainty, coordinate limits, planned evaluation and readiness. No invented customers, awards, model measurements, pesticide savings or hardware execution. Current artwork is described as AI illustration rather than public-dataset footage.

## Browser interactions verified

- Hero CTA scrolls to the identity explanation and starts finite playback.
- Playback reaches100%, stops, and exposes Replay. Pause was clicked during playback, held at5% in an isolated1.2-second stability check, and restored the Play control; manual scrubbing stops playback.
- Native range Home/End moves between first and resolved observations; frame selection preserves one identity.
- Crop sample selection updates the live inspector. Review filter removes the crop/weed sample markers, retains two review records and selects a valid review record.
- Full-map modal opens, traps focus via native dialog, closes with Escape, and restores focus to View full map.
- Sample CSV downloads to the browser download destination; file read back and checked for four records, explicit illustrative provenance and normalized-image coordinates.
- Pipeline ArrowRight selects Link and updates its panel. Home/End behavior follows the same native tab handler.
- Mobile menu opens and closes with Escape. Header links and all page controls remain reachable.
- FAQ opens with readable full copy and no height clipping.
- Page reduced-motion control sets animation-name:none, resolves tracking and prevents automatic playback; manual controls remain. The OS preference path is retained and code-reviewed; OS settings were not changed.
- Browser console: no error/warning entries in the final check. Desktop images loaded successfully.
- Production build passed. Existing Sites worker/package tests passed4/4; packaging is preserved, with no deployment performed.

## Implementation checklist

- [x] Apply selected option2; preserve whole-field map.
- [x] Supply real raster assets and reduce runtime image bytes with WebP.
- [x] Make core controls functional and keyboard/touch accessible.
- [x] Add honest content and cited context.
- [x] Inspect side-by-side full/hero/focused comparisons.
- [x] ResolveP0/P1/P2 findings and recapture desktop/mobile/tablet.
- [x] Keep local preview running and available for user review.

## Follow-up polish and test limits

- [P3] Field photos are illustrative; actual model output will require a separate product validation and design pass.
- [P3] No physical-device or screen-reader session was performed; checks used the in-app browser, native semantics, keyboard interactions and responsive viewports.
- [P3] Award outcomes and judge comprehension were not measured. This report evaluates the implemented presentation, not agricultural efficacy or an award score.
