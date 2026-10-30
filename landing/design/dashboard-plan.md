# Field intelligence dashboard / design review

Target: `/dashboard` in the existing React 19/Vite project. The user explicitly delegated design selection, implementation, review fixes, main push and Vercel deployment. This authorizes agent decisions in place of interactive taste/approval prompts. Scope is the new operational dashboard, with a link from the existing landing.

## Product brief and selected direction

Growers and field-service teams need to turn a phone field walk into evidence they can review plant by plant. Judges should remember: every judgment returns to its source frame. The first viewport prioritizes a real media canvas, a selected plant and the inventory. Existing dark forest/lime tokens, self-hosted Sora/Source Sans 3/IBM Plex Mono, Phosphor icons and Pretext are reused.

Three independent bitmap directions were generated: a forest cockpit, a light olive notebook and a graphite/mint field room. The agent selected the cockpit because it matches the established brand and keeps evidence visible beside the video. `selected-dashboard-reference.png` is the visual source. Generated fictitious session dates, confidence values, 36-plant counts and upload capacity were corrected using actual implementation constraints. A separate clean field panorama replaces the mock's flattened photograph; it is explicitly an illustration.

## What already exists

- The landing remains at `/`, with the existing entire-field atlas and narrative.
- `DESIGN.md`, locally licensed font packages, `MeasuredCopy`, Phosphor icons and the Vite/Sites package are reused.
- No provider key or access token was configured locally or in the Vercel project when inspected. This is an external integration gap, not a successful inference run.

## Information architecture

Desktop: navigation rail → session sidebar → video/timeline/inventory → selected-plant inspector. Navigation always identifies GreenPoint and its current workspace. The Upload video action starts a native dialog; local decoding leads to a new session. Inference runs only after explicit analysis with configured model access. All candidate records can be searched, filtered, inspected, relabeled and exported.

Tablet: evidence inspection follows the inventory in a wider horizontal treatment. Phone: a session drawer replaces the sidebar and persistent bottom navigation exposes Sessions, Atlas and Review. The table drops the long observation column; inspection retains the full copy. Source media keeps its native ratio, including portrait uploads.

## Interaction states

| Feature | Loading | Empty | Error | Success | Partial |
| --- | --- | --- | --- | --- | --- |
| Upload | Numeric extraction progress | Dropzone with choose-file action and limits | Inline recovery text for format, decode, duration or size | Actual sampled previews and crop/session inputs | Cancel discards only the pending upload |
| Inference | Real model stage, frame/batch count and cancel | No-detection message with clearer-clip recovery | Provider errors retain the local video | Candidate records with source evidence | Preserved detections, uncertain labels and explicit coverage |
| Inventory | Existing records remain visible during rerun | Explain why no rows match; Show all plants action | Export/storage failures are visible | Search/filter/atlas, CSV download | Only processed frames are represented |
| Human review | Writes disabled during analysis | Select-a-plant prompt | Storage error asks user to export | Label/count/review status update together | Uncertain remains an explicit outcome |
| Connection | Bounded status check | Sample workspace stays usable | Configured access may still fail with a visible provider error | Configuration state and tab-only access code | No provider completion claim without actual execution |

## Journey storyboard

| Step | User action | Intended feeling | Concrete support |
| --- | --- | --- | --- |
| 1 | Opens the workspace | Oriented within five seconds | Brand, one field image, Upload video and selected plant |
| 2 | Explores sample or uploads clip | Able to begin immediately | No sign-up wall; honest sample; explicit file limits |
| 3 | Starts analysis | In control | Stage counts, coverage and cancellation |
| 4 | Inspects an uncertain plant | Able to challenge the system | Actual image crop, reasoning, original labels and human decisions |
| 5 | Exports inventory | Ownership of the result | Real CSV with provenance and frame-relative coordinates |

## Seven design passes

| Pass | Initial | Reviewed | Resolved decisions |
| --- | --- | --- | --- |
| 1. Information architecture | 6/10 | 9/10 | Remove repeated desktop session/metric header; canvas owns the first screen. |
| 2. Interaction states | 5/10 | 9/10 | Define offline, invalid upload, cancel, partial, zero detections, empty search and rerun isolation. |
| 3. Journey/emotional arc | 6/10 | 9/10 | Sample entry → actual source evidence → reversible human review → export. |
| 4. AI-slop risk | 7/10 | 9/10 | OPERATE surface; no card mosaic, decorative charts, fabricated history or glowing effects. |
| 5. Design-system alignment | 8/10 | 9/10 | Reuse brand and fonts; add a dashboard type role and intentionally compact utility scale. |
| 6. Responsive/accessibility | 5/10 | 9/10 | Native dialog focus/Escape, labels beyond color, portrait bounds, visible phone navigation and reduced motion. |
| 7. Decision register | Unscored | Resolved | Agent selected direction A under the user's explicit delegation. Missing live credentials remain an implementation verification concern. |

Hard rejections: none in the revised target. Litmus: brand, one anchor, scannable hierarchy, one job per region, necessary containers, purposeful motion and quality without decorative shadows all pass. Scores describe design specification, not measured usability. Native reviewers were used; no independent external-model review was run from this Codex host.

## Implementation and verification

- [x] Add dashboard routes and landing entry.
- [x] Native upload, bounded local snapshots, actual media playback and correct portrait geometry.
- [x] Source-backed inspector, candidate inventory, filters/search, human decisions and CSV provenance.
- [x] Real Meta endpoint adapter with official parser, structured output, auth, bounded input/output, cancellation and failure handling.
- [x] Preserve old sessions and human decisions when rerunning.
- [x] Automated transport/data/auth/tracker/export tests and unchanged Sites packaging tests.
- [x] Browser tests for desktop, tablet, phone, upload, playback, labels, search, atlas, dialogs, keyboard and export.
- [ ] Execute a real paid-provider clip after credentials are configured; this cannot be claimed from mocked tests.
- [ ] Record a real-model submission walkthrough after the preceding verification.

## NOT in scope

- GPS maps or calibrated physical coordinates: no camera/GPS calibration data exists.
- Agricultural prescriptions or automated spraying: decisions remain with the operator.
- Measured accuracy, deduplication performance or pesticide savings: require a separate evaluation.
- Accounts, cloud video storage and multi-user collaboration: unnecessary for this judge-visible flow.

## GSTACK REVIEW REPORT

| Review | Runs | Status | Findings |
| --- | --- | --- | --- |
| Design plan | 1 | Reviewed under delegated decisions | All seven passes executed; source deficiencies corrected in the operational specification. |
| Rendered design QA | Iterative | See repository-root `design-qa.md` | Desktop proportions, label density and readable operational copy were refined against the source. |
| Engineering specialists | 2 | Fixed and re-reviewed | Evidence mutation, original-label loss, media synchronization, portrait ratio and review lifecycle fixed. |
| Adversarial review | 1 | Fixed and re-reviewed | Client disconnect now aborts in-flight provider work. |

OUTSIDE COVERAGE: native Codex reviewers completed; external-model coverage unavailable in this host and not represented as completed.

VERDICT: design decisions resolved; real-provider execution remains unverified pending deployment credentials.

NO UNRESOLVED DECISIONS
