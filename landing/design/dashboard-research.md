# GreenPoint dashboard research / 2026-10-31

Scope: a four-day, solo, judge-facing field-video review workflow for Japanese growers and field-service teams. Research covers reusable code and interaction patterns for video evidence and human review. Public technical sources were inspected; no grower interviews, usability study or representative complaint-frequency sample was available. Product conclusions below are design inferences, not measured user findings.

## What the sources establish

| Source | Observed evidence | Decision |
| --- | --- | --- |
| [Meta SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries) and [repository](https://github.com/meta-models/meta-sam) | Typed streaming records, source-pixel boxes, encoded masks and explicit completion outcomes; parser has no runtime dependencies | Reuse `@meta-sam/parser` 0.1.0. Keep native video playback and existing React runtime. |
| [SAM overview](https://dev.meta.ai/docs/sam/overview) | `sam-3.1` uses Responses API and returns geometry | SAM owns segmentation; a classifier never invents evidence boxes. |
| [Image understanding](https://dev.meta.ai/docs/image-understanding) and [structured output](https://dev.meta.ai/docs/structured-output) | Muse accepts image content and structured classification output | Send small plant crops in batches. Validate every returned ID, class, confidence and explanation. |
| [CVAT](https://github.com/cvat-ai/cvat) | A broad image/video annotation platform with collaboration and review | Useful pattern reference for evidence + timeline + inspector. Deploying the entire platform would add unnecessary scope. |
| [Supervision](https://github.com/roboflow/supervision) | Reusable computer-vision tooling, primarily Python | Useful future evaluation tooling; avoid introducing a second runtime just for the dashboard. |
| [Crop-Weed-Detection](https://github.com/Andrew-Boucher/Crop-Weed-Detection) | Crop/weed object-detection project with an MIT license | A trained detector is not a drop-in proof of performance on these fields. Keep it out of this release. |
| [Official event page](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) | Virtual event ending November 4, 21:00 EST | Preserve stabilization and recording time. No prize or performance claims appear in the app. |

## Product story and opportunities

The high-value action is checking one uncertain plant against its actual image, then retaining that decision in an export. A large statistics wall would not help a judge assess that action. The design therefore leads with a field canvas, an evidence inspector and a searchable inventory. Uncertainty is a category, not an error hidden by a confidence percentage. The entire source frame remains visible and coordinates are explicitly non-geographic. A clearly labeled sample offers a reliable walkthrough while live inference remains visibly disconnected until configured.

| Inferred friction | Severity / confidence | Product move |
| --- | --- | --- |
| A classification without its source image cannot be inspected | High / high, directly implied by the review task | Crop actual source frames and retain original model labels alongside human decisions. |
| A long video can be expensive or slow before the first useful result | Medium / medium, inferred; no latency study | Bound preview snapshots, show coverage and support cancellation/partial results. |
| Sparse video views can produce false identity merges | High / high, algorithmic constraint | Link only close, unambiguous observations. Label outputs as candidates until evaluated. |
| Offline or missing credentials can make a hackathon demo look broken | High / observed missing deployment configuration | Keep the sample available and explain local preview versus live analysis. |

This week: connect credentials, test an actual clip, record the complete path and capture provider evidence. Later: evaluate instance identity, optimize dense coverage, interview growers and test field lighting. Deeper research: agronomic treatment decisions, georeferencing and hardware control; these remain outside the prototype.
