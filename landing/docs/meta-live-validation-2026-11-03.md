# Real Meta integration: 2026-11-03

This is an integration record, not a field-accuracy report. Built-in dashboard examples remain hand-authored illustrations. Real test results are separate from those examples and from human decisions.

## Single real UAV image

- Source: [PhenoBench](https://www.phenobench.org/dataset.html), image `05-15_00028_P0030852.png`, from the [public mirror](https://huggingface.co/datasets/Voxel51/PhenoBench_Raw). Planted crop: sugar beet. Dataset attribution: Weyler et al. (2024), CC BY-SA 4.0.
- Only RGB evidence entered the models; the semantic reference annotation was not uploaded. The same scene was used in an earlier local ERFNet comparison. The frame's split is unverified and could overlap that baseline's training data.
- Exact prepared JPEG: 1024 × 1024, 449,905 bytes, SHA-256 `e4497dc1dca6df14569790b67b586e4370f6f80398155fa690fe66a7e860bfa3`.
- Calls: one `sam-3.1` image request and two `muse-spark-1.3` classification batches, all HTTP 200 with parsed/validated output, no automatic retries. Elapsed pipeline time: 21.69194 seconds, excluding image preparation.
- Result: 12 candidates, no candidate-limit truncation; 1 effective crop label and 11 uncertain. One additional original crop suggestion at 0.68 remains effectively uncertain under the unchanged 0.75 review threshold. No effective weed label was returned.
- Small plant crops were frequently too indistinct to classify. This is a limitation to resolve with suitable footage and independent evaluation, not a reason to lower the review threshold or invent labels. Model confidence is uncalibrated.

The local run retained `input.jpg`, `report.json`, and a same-image candidate-box overlay. These private working artifacts are not part of the public asset bundle. Actual dollar spend and provider credit balance were not read or inferred.

## Real maize video

Source: [Tom Fisk / Pexels, Plants on Field Drone Footage](https://www.pexels.com/video/plants-on-field-drone-footage-13525083/), under the [Pexels license](https://www.pexels.com/license/). A genuine 1-second excerpt starting at source time 8 seconds was resized to 960 × 540 at 24 fps, without audio or synthetic camera motion.

The browser uploaded the video, sampled 2 frames and completed segmentation in approximately 6 seconds. It returned 0 candidates, so Muse Spark was not invoked on this clip. The dashboard showed “No plants detected” and exported a run-summary CSV. This verifies the zero-result handling, not that the field is weed-free, not a plant count, and not successful tracking.

## Browser review/export check using a still-photo clip

A separate 1-second H.264 clip was made by repeating the actual PhenoBench RGB image. The filename and session explicitly say “still-photo pipeline check.” Two sampled frames went through real Meta requests and produced 11 linked candidates in approximately 20 seconds: 1 crop and 10 uncertain. Compression/preparation differs from the direct single-image check, so these are separate runs.

The browser operator deferred GP-001, confirmed GP-009 as crop, exported all 11 records, and confirmed the CSV save. The CSV retains the original suggestions, normalized coordinates, run identity, two segmentation requests and two classification requests, with separate deferred/confirmed review states. The result view shows the same-source evidence crop, actual model names and uncalibrated confidence. This establishes the UI/API/review/export path; repeated stills cannot validate movement tracking or real plant counts.

## Interpreting readiness

The provider integration can return real data and preserve uncertainty. It still needs independently selected, sufficiently detailed crop/weed images and genuine suitable motion footage before accuracy, deduplication or agricultural usefulness can be claimed. A clip made by repeating a real still may exercise upload/review/export, but must be explicitly identified as a still-photo pipeline check.

Vercel production credentials are server-only Secrets. The operator code and robot token remain separate; no credential value is committed or included in this record. Physical hardware, GPS projection and treatment decisions are outside the validated scope.
