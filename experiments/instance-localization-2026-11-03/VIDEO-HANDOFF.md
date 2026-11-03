# Recognition evidence for the next video edit

The research point-estimate gate is now passed. These assets are ready to replace repeated UI footage in the next edit. The new agricultural detector is a **working local prototype**, not the current deployed Meta API pipeline. Do not depict the public website as running YOLOv7 until that integration exists.

## Exact English claims

> We froze the detector settings on twenty calibration images, then evaluated forty additional public PhenoBench images. On that comparison, weed precision rose from 76.1 percent to 96.7 percent, while recall stayed near 61 percent. False weed flags fell from thirty-seven to four.

> This twenty-three-pixel weed was labeled crop by our previous experimental pipeline. The agricultural detector correctly labels it weed. This is one selected example; the complete benchmark also includes every miss and false prediction.

> Zoomed tiles recover more plants, but can create duplicate fragments. In the fixed tile comparison, containment-based cleanup raised precision from 87.2 to 92.5 percent, with 63.3 percent recall.

> The smallest plants remain a weakness: the selected whole-frame detector finds nineteen of seventy weeds at thirty-two pixels or smaller. Human review remains essential. These public sugar-beet results are not independent-farm validation.

> The agricultural expert runs locally today. Our deployed Meta perception and evidence-review flow is separate; cloud integration and farm trials come next.

## Footage / evidence to use

- Run `scripts/recognize.py` on `06-05_00181_P0038051.png`, show its real `cases/local-recognition/recognition.json` and overlay. It exactly reproduces all 14 frozen candidates; the measured CPU forward pass was about 0.95 seconds. This is not upload-to-result latency or a cloud runtime claim.
- Use `cases/recovery.png` for a missed 51px weed recovered as an instance box, and `cases/small.png` for the selected 23px class correction. Keep “selected public-data example” visible.
- Show the same-image 40-frame comparison, not a causal 39.7% → 60.7% recall animation across different cohorts. The measured paired recall is 60.2% → 60.7%; precision is the principal improvement.
- Use the fixed `tiles_nms_only` / `tiles_containment` ablation for the cleanup claim. The primary selected whole-frame method uses no containment cleanup, so do not attribute its result to cleanup.
- Keep the source/ground-truth distinction visible, with PhenoBench / University of Bonn, Weyler et al. 2024, CC BY-SA 4.0 attribution. Magnification uses nearest-neighbor source pixels, not synthesized detail.
- Keep existing Meta model outputs, human decisions and the separate recorded Muse → MCP request separate from these agricultural model records. YOLO outputs are boxes; do not attach another run's SAM masks or Muse reasoning to them.

## Suggested three-minute structure

0–12s: one recovered weed and the farmer's review problem. 12–45s: existing real product evidence/review flow once. 45–85s: actual local agricultural inference and two source-pixel case comparisons. 85–112s: complete paired benchmark and the declared smallest-target limitation. 112–143s: real Meta/Muse MCP evidence request and bounded human-review action. 143–165s: traceable human decision / export. 165–180s: scope and next step, with local prototype versus deployed flow explicit.

No new video render or voice generation was performed during this experiment. Preserve the existing movie until the new research segment and deployed-flow claims are reviewed together.
