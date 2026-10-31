# GreenPoint dashboard design QA

Date: 2026-10-31 JST. Surface: `/dashboard`. Classification: operational application UI.

## Evidence and normalization

- Source visual truth: `landing/design/selected-dashboard-reference.png` (generated direction A, agent-selected under the user's explicit delegation).
- Source artwork: `landing/public/assets/dashboard-field.webp`, generated as a clean, unannotated panorama matching the selected direction. It is illustrative, not actual field footage.
- Browser-rendered implementation: `landing/design/dashboard-desktop-final.webp`.
- Full-view comparison: `landing/design/dashboard-comparison-final.webp`; source and implementation are placed together in one image and reviewed together.
- Focused comparison: `landing/design/dashboard-comparison-inspector-final.webp`; source and implementation inspector regions appear together, with source imagery, typography, badge, metadata and actions readable.
- Responsive evidence: `landing/design/dashboard-mobile-final.webp` and `landing/design/dashboard-tablet-final.webp`.
- Original capture directory: `/Users/zip/.gstack/projects/zipking1988-GreenPoint/designs/dashboard-20261031/qa/`.

| Capture | Source pixels | Implementation pixels | CSS viewport | Density normalization |
| --- | --- | --- | --- | --- |
| Desktop full view | 1505 × 1045 | 1505 × 1045 | 1505 × 1045 | `devicePixelRatio=1`; no scaling or device chrome |
| Inspector regions | 306 × 741 | 280 × 881 | Regions from the matched desktop viewport | Unscaled crops, one CSS pixel per image pixel; panel height/width differences are visible, not normalized away |
| Phone | No separate source mobile mock | 375 × 812 | 375 × 812 | `devicePixelRatio=1`; responsive behavior reviewed against the written specification |
| Tablet | No separate source tablet mock | 768 × 1024 | 768 × 1024 | `devicePixelRatio=1`; responsive behavior reviewed against the written specification |

State: dark brand theme, illustrative Kashiwa / East plot session, GP-007 selected as Needs review, unreviewed, all 12 records available. Sample counts are 7 crop, 3 weed and 2 uncertain. The captured sample video is an eight-second static illustration preview. It is not a claim of multi-frame tracking.

## Findings and comparison history

1. **[P2, resolved] First-screen hierarchy and video proportions drifted.** The first implementation put the image at y=387 and the inventory at y=1171 at the source viewport. A duplicate top bar/session summary and a tall landing asset displaced the main workflow. Evidence: `qa/comparison-pass1.png`, which combines the original source and first rendered capture. Fix: remove duplicate desktop metadata, reuse a clean panoramic source asset at its natural ratio, and retain session details in the sidebar. Post-fix: the canvas begins near y=190 and the inventory near y=684; `dashboard-comparison-final.webp` shows the complete intended workflow together.
2. **[P2, resolved] Label density and compact copy reduced readability.** The intermediate implementation drew every example label, including overlapping small boxes, while operational copy was too small. Evidence: `qa/desktop-pass2.png` against the same source. Fix: selected-first overlay of at most six large candidate boxes, explicit category words, a visible label-count disclosure and the complete inventory below. Main reasoning is now Source Sans 3 at 16px; table copy is 13px. Post-fix full-view evidence is the final comparison.
3. **[P2, resolved] Uncertainty badge lost its source hierarchy.** In the pre-final inspector comparison, the Needs review badge had a very subdued tint and small, weak text relative to the source's clear yellow badge. Evidence: `qa/desktop-pass3.png` and the earlier focused comparison. Fix: a solid semantic amber badge with dark text and explicit Needs review copy. Post-fix evidence: `dashboard-comparison-inspector-final.webp`. The final comparison was reviewed again after this fix; no further visual fixes were made in that pass.
4. **[P2, resolved during interaction verification] Portrait geometry and selected evidence were inconsistent.** Source-region, snapshot, video and overlay bounds now share the same constrained aspect ratio. A real 454 × 1248 portrait test clip rendered at 225.39 × 619.98 CSS pixels without stretching. Selecting a live candidate pauses/seeks video and updates timeline/frame together. This is an interaction-state correction beyond the static mock.
5. **[P2, resolved during interaction verification] Native dialog and drawer lifecycle.** React StrictMode could deliver a stale close event to a reopened dialog. The handler now ignores stale events while it is open. Upload, Escape and focus return were retested from a clean load. Phone session navigation traps keyboard focus and restores it to Sessions on Escape.

## Required fidelity surfaces

| Surface | Evaluation |
| --- | --- |
| Fonts/typography | Locally loaded Sora Variable, Source Sans 3 Variable and IBM Plex Mono match the established brand roles. Computed desktop headline: Sora 48.16px/540; reasoning: Source Sans 3 16px/400; table: Source Sans 3 13px/400. Display wrapping, source-crop captions and long explanations remain readable without clipping. Smaller mono is reserved for IDs/time/provenance. |
| Spacing/layout rhythm | The rail, session sidebar, field canvas, filmstrip, inventory and evidence inspector preserve the source composition. The final full-view comparison includes first rows of the inventory above the fold. Tablet inspection moves below the inventory; phone uses a drawer/bottom navigation and a reduced table. No page-level horizontal overflow at 375, 390, 768 or 1505px. Filmstrip horizontal overflow is intentional and scrollable. |
| Colors/tokens | Forest/lime brand values are preserved. Coral and amber have textual categories; the uncertainty badge is now high contrast. Calm surface differences and thin rules provide hierarchy without glow or ornamental shadows. Native focus, selection, range input and scrollbars are themed. |
| Image quality/assets | Actual generated bitmap artwork is used, with a clean panorama and crops of its actual source pixels. No illustration, logo or photo is approximated with custom SVG/CSS shapes. Standard Phosphor icons remain vector UI icons. The new plant photo intentionally replaces the flattened image inside the generated mock; it follows the same maize/soil/broadleaf subject and art direction. |
| Copy/content | Fictitious historical sessions, dates, 36-plant totals, model confidence, row/GPS coordinates and 2GB upload limits were removed. Counts derive from records. All sample data is marked illustrative; live configuration, candidate tracking and human review are explicit. Action labels describe actual outcomes. |

## Intentional, accepted differences

- Twelve actual illustrative records replace the source mock's invented 36-plant count. There is one real sample session rather than fabricated history.
- Not measured replaces invented sample confidence and geolocation metadata. Human review and original/effective labels are represented separately.
- The subtitle is quieter than the generated source to prioritize the operational canvas. Source brand, hierarchy and primary action remain clear.
- The source panorama has a natural 2.75:1 ratio. The full frame is shown rather than distorted to the mock's exact image ratio. The inspector uses crops from the same underlying source.
- Nonfunctional Library/Reports destinations and arbitrary sort controls are omitted. Sessions, frame atlas, review, search and export all perform their stated actions.
- Responsive states have written specifications and browser evidence rather than an invented mobile source mock.

## Interaction verification

- Actual sample MP4 playback, pause, timeline scrubbing, frame selection and restart.
- Plant selection, actual source crop, keyboard Space classification, updated counts, reviewed state, sample persistence and reset.
- Search by ID, filtered empty-state recovery, category filters, 12-item frame atlas and table switching.
- Actual CSV browser download: 13 rows including header, sample provenance, original label, effective label and reviewed status.
- Native upload of a generated H.264 clip: browser decoded it, sampled 12 frames and created a distinct local session. No inference results were fabricated for the upload.
- Portrait test upload preserved source ratio. Unsupported/empty/oversized files are also covered by automated validation tests.
- Missing-provider Analyze video opens an explicit connection explanation while preserving the clip.
- Dialog Escape/focus restoration; phone drawer Shift+Tab wraps and Escape restores Sessions; reduced-motion styles remove motion without hiding content.
- Model credentials and tab access code are not present in browser markup. The API health response returns configuration booleans only.

Production verification: Vercel deployment `dpl_3VGVswPHws6reLCUMouduii5NMAG` for commit `40c2801` reached READY at the public `/dashboard` URL. A fresh production browser tab had no warning/error console entries and no broken images. Search, manual classification, derived counts, reset, MP4 playback and image/video resources passed. The video supports HTTP range requests (206). The health endpoint returned `configured: false`; Analyze returned an explicit 503 `not_configured`, without simulated model results. A final correction suppresses a stale saved-decision message after resetting the sample.

Development QA exposed the stale-dialog lifecycle issue and one transient Fast Refresh drawer ref error; the final clean-load phone drawer test passed. Historical development logs are not presented as a clean production run.

Automated checks: 13 analysis tests and four Sites packaging tests passed; production build passed. Live Meta execution remains unverified because server credentials are absent. That is a functional integration concern, separate from rendered visual acceptance.

## Implementation checklist

- [x] Compare source and rendered implementation in a combined full-view input.
- [x] Compare focused typography/inspection details in the same input.
- [x] Fix and recapture all actionable P0/P1/P2 visual findings.
- [x] Verify phone/tablet and core interactions with rendered evidence.
- [x] Preserve explicit sample, coverage, uncertainty and non-GPS wording.
- [ ] Configure provider credentials, run a real field clip and record a real-model walkthrough before hackathon submission.

Follow-up polish: a dedicated mobile mock could guide later field testing, but no actionable P0/P1/P2 design mismatch remains in the accepted dashboard scope.

## Generic MCP extension, 2026-10-31

The existing Connection settings dialog now has Analysis models and Robots & agents tabs. The dashboard canvas, visual assets, tokens and sample records are unchanged. The new panel exposes the actual MCP endpoint and an initialization/discovery/sample-call diagnostic. It reports three tools and 12 illustrative records after a real local request; it does not claim that a successful public diagnostic means live models are connected.

Desktop (1280 × 720) and phone (375 × 812) were inspected in the in-app browser. Dialog headings and Done stay visible while the body scrolls; the public endpoint and diagnostic precede the tool details. Phone page and panel widths had no horizontal overflow. Arrow-key tab changes and Escape focus restoration passed. A fresh local load had no warning/error console entries. Captures: `/Users/zip/.gstack/projects/zipking1988-GreenPoint/designs/mcp-20261031/local-desktop.png` and `local-mobile.png`. The copy action received the browser Clipboard API success response, but the automation's separate virtual clipboard did not expose that value, so actual paste was not verified.

Review found and fixed JPEG size inflation caused by re-encoding a valid low-quality frame at higher quality. The final implementation fully decodes to validate, then preserves original normalized JPEG bytes. A deterministic textured 1280 × 1280 regression reproduces the old boundary and verifies the fix. Independent security and client/API reviewers reported no remaining findings.

Checks: nine MCP tests, 13 existing analysis tests and four Sites tests passed; production build and dependency audit passed. MCP tests use the official client over actual HTTP and a controlled fake model upstream. Real Meta inference, physical devices, browser-session synchronization, world coordinates and hardware actions remain outside the verified result. See `landing/docs/MCP.md` for the implemented contract.

## Approved charcoal / sage refinement, 2026-10-31

Source visual truth: the three current production captures in `reviews/color-audit-2026-10-31/` in the original project workspace, plus the user's explicit approval of charcoal UI surfaces, reduced decorative lime and sage crop data. Original layout, typography, photography and workflows remain the source; the old broad green surface treatment is intentionally superseded. Shared palette: `landing/src/palette.css`.

This color-only release was isolated from concurrent, uncommitted functional changes in the primary checkout. Final screenshots and checks use a separate worktree based on `f39ec2f`, served on loopback port 4187. No concurrent review-queue, video-limit or copy changes are part of this patch.

| Evidence | Normalization | Result |
| --- | --- | --- |
| `landing/design/color-refinement/landing-hero-comparison.webp` | 1280 × 720 source and implementation, CSS 1280 × 720, DPR 1; arranged together without scaling | Hero imagery and lime phrase/CTA retained; neutral chrome and sage crop legend |
| `landing/design/color-refinement/landing-explanation-comparison.webp` | Same viewport, #approach aligned at y=110, first observation selected; combined input | Same geometry/wrapping; explanatory headline and ID are now white |
| `landing/design/color-refinement/dashboard-comparison.webp` | Same viewport, default illustrative sample, GP-007 unreviewed, All 12, no keyboard focus; combined input | Charcoal canvas/sidebar/inspector and muted subtitle; unchanged source crop and regions |
| `landing/design/color-refinement/crop-overlay-comparison.webp` | Unscaled 626 × 232 source-image regions arranged together | Sage crop boundaries/labels agree; coral weed and amber review retained; dark outline supports boundaries over foliage |
| `landing/design/color-refinement/05-dashboard-mobile.webp`, `06-landing-mobile.webp`, `07-connections-mobile.webp` | 375 × 812 CSS/pixels, DPR 1 | No horizontal page/panel overflow; navigation and fixed dialog controls remain usable |

Five required fidelity surfaces: fonts are the same self-hosted Sora, Source Sans 3 and IBM Plex Mono with verified loaded font faces; type sizes, wrapping and weights match the original states. Spacing, grid dimensions and photo bounds match the paired captures. Colors follow the approved shared roles, including dialogs and loading/error states. All raster assets and image crops are preserved without recoloring or redrawing. Copy, counts, provenance and functional behavior match the committed base.

Verification history: a shared-checkout capture included concurrent copy/review changes and was rejected as a comparison target. The initial isolated development preview also blocked symlinked font assets; those captures were rejected. The preview was allowed to serve only its exact bundled font directories, then recaptured with both font checks true. This preview setup is not committed. The final combined and focused comparisons were reviewed again with matching font, pointer and data states; no actionable P0/P1/P2 differences remain outside the approved color changes.

Browser checks: Crop 7 / Weed 3 / Review 2 filters retain their rows and now use sage/coral/amber selected fills; All 12 remains lime. The category selectors were given sufficient specificity to override the generic active filter rule. Mobile landing navigation opens the workspace; Connections → Robots & agents completes the actual public MCP test (3 tools / 12 illustrative records). Desktop and phone capture widths are unchanged and the clean isolated preview has no warning/error console entries.

Contrast checks: normal text/canvas 16.36:1; muted text/surface 7.64:1; dim text/surface 5.90:1; crop text/surface 8.81:1; explicit control boundaries 3.08–3.43:1 against adjacent surfaces. These sampled pairs do not constitute a full accessibility certification. Category words/symbols remain alongside color.

Independent source review found no remaining issues in CSS validity, variable inheritance, selected-filter specificity or agreement between mask and CSS crop colors. Production build plus 13 analysis, nine MCP and four Sites tests passed in the isolated worktree. Real model inference and hardware validation remain unverified as before.

final result: passed
