# Third-party notices and research inputs

The root MIT license applies to original GreenPoint source code and documentation. It does not relicense third-party code, model weights, datasets, photographs, fonts, provider output, or other separately attributed material. Installed dependencies retain their own licenses.

## PhenoBench and Bonn imagery

Public agricultural photographs, annotations and derived photographic figures in the recorded app evidence, experiment galleries, submission evidence and demo are attributed to University of Bonn / the respective dataset authors. PhenoBench: Weyler et al., *PhenoBench — A Large Dataset and Benchmarks for Semantic Image Interpretation in the Agricultural Domain*, IEEE TPAMI, 2024. Data and image adaptations retain [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Crops, boxes, masks, labels and comparison panels are marked adaptations. See the [PhenoBench dataset](https://www.phenobench.org/dataset.html) and each recording's provenance for the original source. Bonn Sugar Beets 2016 footage has its separate source attribution in the published recordings.

## YOLOv7 source and inference adapter

`experiments/instance-localization-2026-11-03/vendor/upstream/models/` contains source from [WongKinYiu/yolov7](https://github.com/WongKinYiu/yolov7), commit `84932d70fb9e2932d0a70e4a1f02a1d6dd1dd6ca`. `vendor/inference/models/` is a modified, inference-only extraction of that source; its selected definitions, omitted construction/training paths and hashes are described in `adapter-provenance.json` and `scripts/prepare_adapter.py`. These upstream and derived files retain **GPL-3.0**, whose complete text is in `vendor/upstream/LICENSE.md`. They are not covered by the root MIT license. No weights are redistributed in this repository.

## ERFNet research dependency

The previous local comparison used the official PhenoBench ERFNet architecture, itself based on [Eromera/erfnet_pytorch](https://github.com/Eromera/erfnet_pytorch), whose `license.txt` specifies **CC BY-NC 4.0**. That architecture and its weights are **not included** in this source publication and are not granted MIT rights. Reproducing that optional baseline requires separately obtaining the architecture under its original terms; `experiments/recognition-2026-11-03/scripts/fetch_architecture.py` identifies the exact source, upstream license and hashes. This dependency is unnecessary for the selected standalone YOLO detector.

## Pretrained agricultural weights

YOLOv7, Faster R-CNN and ERFNet checkpoints were pretrained by their original authors, not by GreenPoint. Download URLs, byte counts and hashes are recorded in the experiment provenance. Weights and runtime environments are excluded from Git and from the submission source publication. Downloading or using those weights is subject to their own upstream terms; the MIT license does not grant rights in them.

## Other media and services

Landing artwork is labeled AI-generated illustration. The video narration was generated with ElevenLabs Bella; it is not a voice recording of a team member. Meta SAM and Muse responses are recorded provider outputs with their original run identity, not GreenPoint-trained weights. Application fonts and icons retain their package licenses. No API credentials or model access tokens are part of the source release.
