# GreenPoint judge demonstration

The three-minute script below is a preparation target, not a verified submission video limit. Confirm the current portal's format before submitting. No contest entry, waiver, messages or video has been submitted automatically.

## 180-second script

**0–20s — Problem.** “A grower can walk a plot, but a leaf-level decision disappears into hours of footage. GreenPoint keeps the plant, its source pixels, and the review decision together.”

**20–40s — Open the product.** Open `/dashboard`. Say: “This is a **recorded real Meta run**, on public PhenoBench sugar-beet imagery. It is not a new paid inference or Japanese phone footage. The original farmer-focused visual walkthrough remains on the landing.”

**40–80s — Evidence.** Select GP-001. Pan or zoom: the connector follows its actual source box to the right-hand crop. Expand model evidence. “SAM 3.1 found the region. Muse Spark suggested a label. Confidence is uncalibrated. This still-image example does not establish tracking performance.”

**80–110s — Decision.** Set **Keep for review**, then Save & next. Open Video and reselect GP-001. Show that the deferred decision and original model label remain separate. Export CSV with session/run identity, normalized coordinates, source and review state. “We keep uncertainty as a useful output.”

**110–140s — Agent.** Open Agents, run the public MCP connection test, and open the recorded Muse trace. “Muse actually called capability discovery and authenticated frame perception. Its next step was human review. This is a generic upper-level agent integration; no physical robot or drone was connected.”

**140–165s — Results.** Open `/validation.html`. “The frozen twenty-image check found three of eighty-eight annotated weeds. All three weed predictions matched, but that tiny positive sample and 3.4% recall are not reliable weed recognition. Our reference comparison increased crop-as-weed errors, so it stays experimental. Native video returned zero candidates.”

**165–180s — Next step.** “The achievement is a working, auditable perception-to-review loop using Meta's models. Next we need better weed recall, persistent identity ground truth, and farmer trials before field deployment.”

## 60-second version

“GreenPoint gives every plant judgment a source. This labeled replay is a real SAM 3.1 and Muse Spark run on public sugar-beet data. Select a plant: the source box and evidence crop stay linked while you pan and zoom. Change it to ‘keep for review’ and the original model judgment remains intact. Map, video inventory and CSV share the same session and run. A Muse agent also used our authenticated MCP tools and requested human review, without controlling hardware. We publish the misses: three weeds found out of eighty-eight, so this remains an assisted-review prototype. Better recall and real farmer trials are the next gate.”

## Demonstration modes and fallback

- **Recorded real run:** default map, exact source frames and validated saved provider results; no key and no inference on page load.
- **Live sampled frames:** operator supplies a clip ≤6s and the workspace access code; at most twelve snapshots. Crop reference is optional and experimental. Choose Skip for the baseline.
- **Native video beta:** explicit full-clip transfer disclosure, H.264 ≤2MB, ≤6s, ≤1280px/axis, ≤30fps. The two real clips returned zero candidates; do not promise successful tracking. There is no automatic fallback.
- **Illustrative design walkthrough:** source selector → Illustrative field layout. Disclose generated artwork and hand-authored records.
- If live inference fails, retain/export the partial run and switch explicitly to the labeled recording. Never change a recording's badge to “live.”

## Questions to answer candidly

| Judge question | Answer |
| --- | --- |
| Why Meta? | SAM supplies boxes/masks and native-video primitives; Muse supplies visual review suggestions and the separate MCP tool-calling agent. Both use Meta Model API. |
| Does it recognize weeds reliably? | Not yet. Twenty frozen images: three correct weed predictions, 3/88 recall. Uncertainty/misses included; targets failed. |
| Why keep crop reference? | It is an opt-in experiment, not a proven improvement. Development produced four crop-as-weed mistakes out of forty crops. |
| Is this a geographic field map? | No, source-image coordinates only. Georeferencing/calibration and position validation are future work. |
| Is tracking validated? | No. The genuine moving clips returned zero candidates. Source annotation keys are not persistent identity ground truth. |
| What do robots get? | Authenticated, stateless single-frame perception with review-required/treatment-not-authorized flags. The Muse agent trace is real; hardware integration is not tested. |
| How much pesticide/time is saved? | Neither was measured. Policy targets and team walkthroughs are not product outcomes. |
| What is reproducible? | Frozen input IDs/hashes, deterministic split selection, known development-only reference, scoring method, per-image model output and original label provenance. |

## Operator walkthrough checklist

Before a presentation, use the actual presentation device. Check map selection/connector → defer decision → switch workspace → export → public MCP probe → report. Record completion, errors and timing separately for each operator. Compare against watching the same source evidence without GreenPoint only when real people perform both tasks. No farmer interviews, external user feedback or time-saving baseline has been collected by this sprint.

Public data attribution and license: `/licenses/public-data.md`. Full result: `/validation.html` and `/assets/verified-run/benchmark.json`.
