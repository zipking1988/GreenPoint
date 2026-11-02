# Public data used in GreenPoint evidence

Data and derived JPEG/video excerpts, crops, bounding-box reference annotations and model overlays in `/assets/verified-run/` are licensed under **Creative Commons Attribution-ShareAlike 4.0 International**: https://creativecommons.org/licenses/by-sa/4.0/ . This does not relicense unrelated GreenPoint source code, fonts or illustrative brand assets.

## PhenoBench

Jan Weyler, Federico Magistri, Elias Marks, Yue Linn Chong, Matteo Sodano, Gianmarco Roggiolani, Nived Chebrolu, Cyrill Stachniss and Jens Behley. *PhenoBench — A Large Dataset and Benchmarks for Semantic Image Interpretation in the Agricultural Domain.* IEEE Transactions on Pattern Analysis and Machine Intelligence, 46(12), 9583–9594, 2024.

Original data, license and citation: https://www.phenobench.org/dataset.html . Frozen input IDs and SHA-256 hashes: `/assets/verified-run/manifest.json`.

Changes: selected RGB images converted to JPEG, model-produced overlays, boxes derived from independent instance/semantic masks. No annotation was sent to Meta except the declared development-only known crop reference used in the experimental reference configuration. All twenty evaluation images were scored, including misses and uncertain results.

## Sugar Beets 2016

Nived Chebrolu, Philipp Lottes, Alexander Schaefer, Wera Winterhalter, Wolfram Burgard and Cyrill Stachniss. *Agricultural robot dataset for plant classification, localization and mapping on sugar beet fields.* The International Journal of Robotics Research, 2017. DOI: 10.1177/0278364917720510.

Original data/license: https://www.ipb.uni-bonn.de/data/sugarbeets2016/ . MP4 sample: https://github.com/supervisely-ecosystem/sugarbeet-multiview-sample-video-project-annotated , commit `0763cbbd251701c97f0c5fc7eee999af1a929afd`, `project/ds0/video/2016-05-05-12-59-07_16_rgb.mp4`.

Changes: source seconds 0–4 and 6–10, resized from 1296×966 to 1280×954, H.264 at 10 fps; extracted source frames. Genuine camera movement, no generated intermediate frames. Original video hash and prepared excerpt hash are retained in the recorded session. The published excerpt is seconds 6–10. The robot's original localization sensors are not used by GreenPoint.

These data sources do not endorse GreenPoint. Public-data results do not establish farmer outcomes, phone/drone generalization, identity-tracking accuracy or safe actuation.
