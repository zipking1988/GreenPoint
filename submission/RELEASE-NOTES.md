# GreenPoint hackathon submission · 2026-11-03

GreenPoint connects plant suggestions to source pixels, human review and traceable exports. This release adds the final three-minute demonstration, public research evidence, the complete local recognition experiments and submission copy.

- [Watch the 3-minute demo](https://greenpoint-vert.vercel.app/demo.html): 1080p, ElevenLabs Bella American female narration, English captions.
- [Try the online workspace](https://greenpoint-vert.vercel.app/dashboard): recorded real SAM/Muse evidence, human review and export; fresh inference requires authorization.
- [Inspect the agricultural experiment](https://greenpoint-vert.vercel.app/agricultural-research.html): 20 calibration images, frozen configuration, 40 additional images; selected detector precision 96.7%, recall 60.7%, 4 unmatched weed flags. The previous experimental hybrid had 76.1%, 60.2%, and 37. Smallest-target recall regressed from 26/70 to 19/70.
- [Read the submission copy](https://github.com/zipking1988/GreenPoint/blob/main/submission/submission-copy.md).

The agricultural weights were pretrained by their authors. This is a **local research branch, not deployed**, and a same-public-dataset comparison rather than independent-farm validation. Its figures do not replace the online Meta baseline. Coordinates remain image-space; GPS, motion identity and hardware action are not established.

Original code is MIT licensed. Bundled YOLOv7 source retains GPL-3.0; the optional ERFNet architecture is separately obtained under its upstream noncommercial terms. Model weights, environments and credentials are excluded. See `THIRD_PARTY_NOTICES.md`.

Validation: 65 existing application checks pass; production build passes; all 12 published comparison rows recompute from included scored predictions; both frozen selection hashes and the final movie SHA match. Credential scan passes. The video previously passed full decode, audio checks and review of all 32 shot samples.

MP4 SHA256: `613d1416bf783c0860cee5419e052fedbca480fbdb6a0f3390ddc4fb5f66075a`.

Assets: final MP4, English SRT, poster and a full editing kit containing the actual recorded clips, narration and research evidence. Publishing this release is separate from completing the organizer's authenticated submission form.
