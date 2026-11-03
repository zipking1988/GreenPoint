# Reproduce the recognition experiment

Run commands from this directory. The default output is local research evidence, not a product deployment. No video work is performed. Existing paid responses are cached; **do not delete the caches to seek a better answer**. Provider responses can change on a fresh run.

## Runtime and inputs

The recorded run uses Python 3.12, torch 2.8.0 on CPU, four torch threads, and Node 22.22.3. Exact Python dependencies are in `requirements-lock.txt`. Install into a virtual environment rather than the global Python environment:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-lock.txt
.venv/bin/python scripts/fetch_architecture.py
.venv/bin/python scripts/fetch_weights.py
.venv/bin/python scripts/fetch_data.py
.venv/bin/python scripts/verify.py
```

Weights are downloaded from the official Bonn URL and verified before loading with `torch.load(..., weights_only=True)`. The optional ERFNet architecture is separately licensed CC BY-NC 4.0 and is excluded from this source distribution. Review the linked upstream terms before using `fetch_architecture.py`; it downloads a pinned file into ignored `vendor/erfnet.py`, verifies its hash, and reproduces the recorded two-line header/unused-import change exactly. No pretrained backbone download occurs during inference. Checkpoint and architecture hashes are recorded. See the repository's `THIRD_PARTY_NOTICES.md`.

The original local Node dependency link is excluded from Git. On another machine, install `sharp@0.35.5` and `@meta-sam/parser@0.1.0` under `vendor/landing`; exact recorded versions are in `node-runtime.json`. `vendor/source-hashes.json` identifies the copied product source files. The source commit for the original comparison is `dcd0e31cd47f9cfd27fa5c2fb2742e8ce5a55fc5`.

The public repository includes frozen selections, manifests, recorded provider responses and scored predictions. Image downloads, probabilities, generated masks/features/candidates, model weights and environments are excluded. Run the fetch and preparation commands before checks that read those files. These are cache exclusions, not changes to the recorded experiment.

## Re-score the already-recorded experiment (no paid API calls)

The ignored `probabilities/` caches can be regenerated from RGB alone:

```sh
.venv/bin/python scripts/infer_erfnet.py --phase development
.venv/bin/python scripts/infer_erfnet.py --phase evaluation
.venv/bin/python scripts/infer_erfnet.py --phase confirmatory
node scripts/prepare_masks.mjs --phase development --geometry whole
node scripts/prepare_masks.mjs --phase development --geometry tiles640
node scripts/prepare_masks.mjs --phase evaluation --geometry whole
node scripts/prepare_masks.mjs --phase evaluation --geometry tiles640
node scripts/prepare_masks.mjs --phase confirmatory --geometry whole
node scripts/prepare_masks.mjs --phase confirmatory --geometry tiles640
.venv/bin/python scripts/evaluate.py --phase development
.venv/bin/python scripts/evaluate.py --phase evaluation
.venv/bin/python scripts/evaluate.py --phase confirmatory
.venv/bin/python scripts/error_analysis.py --phase evaluation
.venv/bin/python scripts/error_analysis.py --phase confirmatory
.venv/bin/python scripts/make_artifacts.py
```

`selection.json` was frozen once using `--phase development --select`, after all 5 development images had run with both geometries. It cannot silently overwrite an existing selection. `selection-freeze.json` records the selection SHA before evaluation/confirmation inference. Do not use final evaluation labels to change it.

## Local RGB recognition, no annotations

This command runs real local inference, uses source-identical SAM candidates already recorded for the frame, and exports labels, source boxes, an overlay and provenance:

```sh
.venv/bin/python scripts/recognize.py \
  --image data/train/images/05-15_00203_P0030690.png \
  --sam-candidates candidates/development/whole/05-15_00203_P0030690.png.json candidates/development/tiles640/05-15_00203_P0030690.png.json \
  --output cases/local-recognition
```

Omit `--sam-candidates` to run the agricultural semantic/connected-component baseline on another 1024×1024 RGB image. This mode has substantial false positives, as measured in the report. The crop context is sugar beet; no cross-crop or new-farm claim. Candidate/source names and SHA must match. No annotations enter either path. Every output requires human review; the program authorizes no treatment or hardware action.

## Paid SAM / Muse recording

`run_sam.mjs` requires `--live` and the server-only `MODEL_API_KEY`. It uses the copied original Meta integration, with its fixed upstream host, bounds, prompts, models and parser. A local ignored `.env.local` can contain the key; never copy it into the display bundle. The existing project key can be loaded without printing it via Node's `--env-file` option.

The shared ledger path is deliberately the existing sprint ledger, recorded in `protocol.json`. Keep all provider runs sequential. The runner stops new experiments at $8 of a $10 total, with $2 reserved for regression. Unknown billing retains its reservation. Failed requests are cached and counted; there are no automatic paid retries. Authentication failure stops new provider calls.

```sh
node --env-file=.env.local scripts/run_sam.mjs --phase development --geometry tiles640 --live
node --env-file=.env.local scripts/run_sam.mjs --phase development --geometry tiles512 --live
node --env-file=.env.local scripts/run_sam.mjs --phase evaluation --geometry tiles640 --live
node --env-file=.env.local scripts/run_confirmation.mjs
```

Confirmation runs the original whole-frame SAM + Muse comparison and the frozen tile geometry sequentially. Budget snapshots are estimated/held usage, not reconciled billing. Data are public PhenoBench RGB; semantic/instance annotation files are read only by scoring scripts.

## Inspect the evidence

`evidence-gallery.html` embeds its images and data, so it can be opened directly. Switch Source / Current / Hybrid / Ground truth for the same selected frame. Static photographic panels are in `cases/`. Examples were selected after evaluation and include failures; aggregate tables cover every image.

Images and derived figures: PhenoBench, Weyler et al., TPAMI 2024 / University of Bonn, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Official model/code source: [PRBonn/phenobench-baselines](https://github.com/PRBonn/phenobench-baselines). Model weights and environment stay out of the public display package; deployment/distribution of the research model is a separate decision.
