# Reproduce agricultural instance localization

Run commands from this directory. This is a local research prototype, separate from the deployed app. No model was trained by GreenPoint.

## Environment and pinned inputs

Python 3.12, torch 2.8.0, torchvision 0.23.0, CPU FP32 with four threads. Exact packages are in `requirements-lock.txt`.

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-lock.txt
python3 scripts/download_yolo.py
python3 scripts/download_rcnn.py
python3 scripts/freeze_data.py
python3 scripts/prepare_adapter.py
```

The sibling `../recognition-2026-11-03` experiment is required for the shared matching implementation, frozen previous strategy and original parser/API integration. Full baseline reconstruction additionally requires its separately licensed ERFNet architecture and weights; follow its `REPRODUCE.md` and the root `THIRD_PARTY_NOTICES.md`. The selected standalone YOLO recognizer does not need ERFNet. Original recorded inputs/outputs remain unchanged. `freeze_data.py` verifies the exact frozen selection; it never silently changes images. ZIP ranges validate compressed member CRC, plaintext size and final SHA.

The public source release includes frozen selections, scored outputs, provider caches, provenance and case evidence. Raw local inference, downloaded data/weights and generated masks/features/candidates are excluded; rerun the preparation/inference stages before checks that read these caches. No model weights are redistributed.

YOLOv7 official weights: 74,940,809 bytes, SHA256 `8056bd426e59ad40dcbc32cb468549658aeeef4ba48e4cda356258d8cb39c6e8`. Faster R-CNN official weights: 494,439,552 bytes, SHA256 `db785d323941a883c0308a2ebdf20c6c681d18c993fcff9c26382e4e69b2c94b`. Sources are recorded in the model provenance JSON files. Check those hashes when reproducing an externally refreshed download.

The YOLO adapter extracts unchanged inference class definitions and Model forward methods from upstream commit `84932d70fb9e2932d0a70e4a1f02a1d6dd1dd6ca`. Training, hub loading, eval-based construction and unrelated imports are omitted. The checkpoint is loaded with `weights_only=True` and a finite reviewed class/global allowlist; unrestricted pickle loading is never used. Faster R-CNN loads the author's state_dict strictly into the matching three-class torchvision architecture. Its low-score/high-NMS raw cache is a declared research adaptation; the official-default postprocessing is reported separately.

## Calibration and freezing

```sh
.venv/bin/python scripts/infer.py --phase development --model erfnet
.venv/bin/python scripts/infer.py --phase development --model yolo --geometry multiscale
.venv/bin/python scripts/infer.py --phase development --model faster --geometry multiscale
.venv/bin/python scripts/calibrate_models.py --model yolo
.venv/bin/python scripts/calibrate_models.py --model faster
```

The completed experiment has already selected/frozen `selection.json`; do not rerun selection on the confirmation labels. `finalize.py` was run once after the two calibration runs and before any candidate-model confirmation inference. It checks that neither candidate has begun confirmation inference. `selection-freeze.json` pins the final selection SHA. Earlier failed stages and grids are preserved as `calibration-stage1-*`, `calibration-stage2-*`, and `calibration-history.json`.

Calibration uses 20 new official val images; confirmation uses 40 different val images. All previous 45 images and the smoke frame are excluded. These are image-disjoint samples within one public agricultural domain, not independent farm/sequence validation; author checkpoints may have used the official validation split for their own selection.

## Re-run RGB-only inference and score frozen methods

```sh
.venv/bin/python scripts/run_local_confirmation.py
```

This caches full RGB inference for ERFNet, YOLOv7 and Faster R-CNN. Only the scorer reads annotation files. Complete raw views, including low-score candidates and source SHA, are retained under ignored `raw/`. Every view has a 1000-candidate safety cap and reports `limited` if reached. The previous benchmark's class-agnostic greedy one-to-one IoU>=0.5 definition is unchanged; all partial and small plants remain in the denominator.

## Record the previous frozen SAM/ERFNet comparison

The following is the only paid-provider stage. The local ignored key file is the existing project's server-only Meta key; never print or commit it.

```sh
node --env-file=/absolute/path/to/landing/.env.local scripts/record_baseline.mjs
.venv/bin/python scripts/score.py --previous
```

`record_baseline.mjs` uses cached SAM views when present and never retries a failed paid request. All provider calls are sequential and use the original shared budget ledger named in `protocol.json`: stop new experiments at $8, total $10, reserve $2 for regression. Optional fresh Muse classification was stopped after repeated provider errors; all failures and unknown billing reservations remain. Its incomplete cohort is omitted as a whole method rather than being presented as a complete forty-image comparison. The main previous_whole and previous_hybrid comparisons cover all 40 images.

## Local recognition on an RGB frame

```sh
.venv/bin/python scripts/recognize.py \
  --image data/confirmation/images/06-05_00181_P0038051.png \
  --output cases/local-recognition
```

This runs the frozen detector and exports source-coordinate boxes, labels, a photograph overlay, provenance and timing. It reads no annotations and makes no API call. Current input contract: one orientation-normalized 1024x1024 RGB sugar-beet-domain frame. Scores are uncalibrated. Human review is required; no treatment or hardware action is authorized.

## Verify and generate the evidence

```sh
.venv/bin/python scripts/verify.py
.venv/bin/python scripts/report.py
.venv/bin/python scripts/package_evidence.py
```

`verify.py` independently recomputes every method's matching/count metrics with a separate vectorized implementation, checks all 60 input triplets by SHA/CRC/size, confirms split exclusion and verifies the frozen selection. The standalone recognizer is also compared with a recorded selected-model result. Figures were visually inspected; gallery JavaScript is checked across its case/mode paths. Browser rendering was not tested because the available CUA connection had timed out in the preceding experiment.

The display bundle excludes model weights, environment, download parts, secrets, video and raw API caches. It includes the complete measured table and selected success/failure cases. Read `REPORT.md` for the important <=32px recall regression and the difference between point-estimate gates and field validation.

PhenoBench data/derived figures: Weyler et al., TPAMI 2024 / University of Bonn, CC BY-SA 4.0. Original model code licenses remain separate; upstream YOLOv7's license is retained in `vendor/upstream/LICENSE.md`.
