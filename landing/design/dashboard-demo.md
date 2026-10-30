# GreenPoint / judge demo readiness

## Highest-impact finding

The dashboard is implemented and reviewable, but the deployed project has no Meta provider credential or operator access code configured. The sample is a trustworthy workflow demonstration, not evidence of a successful AI run. Connecting and validating the actual models is the next highest-impact step before submission. A polished sample alone cannot establish the sponsor-tooling or technical-performance claims.

The official event page lists the close as November 4, 21:00 EST, which is November 5, 11:00 JST. Submission format and detailed percentage weights were not verified from a published waiver in this session; use a conservative three-minute video and public repository assumption until confirmed.

## Current evidence and score range

The following is an internal, qualitative 1–5 readiness assessment, not a predicted judging result.

| Criterion | Current | After a successful real-provider clip | Evidence |
| --- | --- | --- | --- |
| Impact | 3 | 3–4 | Specific field-review task; no grower trial or measured saving yet |
| Meaningful Meta tooling | 1 | 4 | SAM/Muse transport, parser and validation implemented; actual provider execution unverified |
| Demo quality | 4 | 4 | Working responsive workflow, real local upload, source inspection and CSV; clearly labeled sample fallback |
| Technical execution | 3 | 4 | Conservative tracker, cancellation propagation, output allowlists, raw/effective labels, 17 passing tests; field evaluation remains pending |

SAM segmentation and Muse classification each have strong core fit: removing either changes the main analysis path. This is a substantive integration design, but only successful real-provider evidence can substantiate that it works.

## Winning narrative

A grower walks a small plot with an ordinary phone. GreenPoint proposes plant candidates from the video and shows the source evidence beside every classification. The grower can challenge an uncertain result, keep the original model suggestion in the record, and export the reviewed inventory. The useful outcome is an inspectable information layer before action, with uncertainty and coverage visible. No pesticide reduction or measured accuracy is claimed.

## Three-minute script

| Time | Action and narration |
| --- | --- |
| 0:00–0:25 | Show a field walk. Explain one grower's need to review individual plants across scattered plots. |
| 0:25–0:45 | Open `/dashboard`. Point to the video, candidate identity and evidence inspector. |
| 0:45–1:15 | Upload a short real clip, name the planted crop, start analysis and show real progress. This segment requires configured, verified credentials. |
| 1:15–1:45 | Select an uncertain plant. Inspect its actual frame crop. Explain SAM geometry, conservative linking and Muse's label suggestion. |
| 1:45–2:10 | Make a human decision, show counts/review status changing, filter the inventory and export the actual CSV. |
| 2:10–2:35 | Show the two-model boundary, the original label retained for audit, bounded input and cancellation. Explain why sparse observations are separate candidates. |
| 2:35–3:00 | State the current limits and next validation: representative field clips, identity ground truth, classification errors and farmer usability. |

Fallback transition: “The live service is unavailable, so I’ll demonstrate the same review workflow using this explicitly illustrative sample.” Select Kashiwa / East plot, inspect GP-007, change its label and export the sample CSV. Do not narrate it as live inference or measured tracking.

## Keep, cut, stabilize

Keep source-backed inspection, three-way classification, manual decisions, actual export and explicit partial coverage. Cut accounts, collaboration, prescription, spraying hardware and geographic mapping from this submission. Stabilize a representative real clip before expanding sampling density or adding model features. Record a backup of the complete verified real-model flow; the repository's static sample video is not that backup recording.

## Likely judge questions

- **Is this accurate enough for treatment?** Accuracy is unmeasured. The interface supports human review and does not execute treatment.
- **Are these unique plants?** They are candidate identities. Close, unambiguous observations can be linked; sparse views stay separate. Identity performance needs instance-level ground truth.
- **Are the coordinates GPS?** No. CSV coordinates are normalized to the source frame.
- **What happens without a model connection?** The original video remains local; the app offers local frame preview and a clearly illustrative sample workflow.
- **Where are videos stored?** In the current tab. Selected JPEG snapshots/crops go to Meta only when analysis is explicitly started. No database or cloud video storage is implemented.
- **What has been tested?** Authentication, input/output bounds, genuine SAM wire grammar, incomplete streams, conservative labels, evidence isolation, cancellation, tracker cases and CSV provenance, plus browser flows at desktop/tablet/phone sizes. Paid Meta execution still needs verification.

Next action: configure the two server environment variables, deploy, run one representative field clip and save the resulting provider evidence before recording the submission video.
