# GreenPoint

**See the field. Plant by plant.**

A phone-first approach to turning a field walk into a reviewable, per-plant weed map.

GreenPoint is designed for Japanese growers and field-service teams managing scattered plots. The idea is simple: record an ordinary phone video, link repeated views of each plant, and give a person a clearer inventory to review.

## Project status

GreenPoint is an early research and hackathon prototype.

| Area | Status |
| --- | --- |
| Interactive landing page | Implemented in the local development workspace |
| Illustrative field atlas and sample CSV | Implemented |
| Video upload and live model inference | Planned |
| Plant tracking and classification pipeline | Proposed; not validated |
| Public-data evaluation and real-field trials | Planned |

The landing source is available in [`landing/`](landing/). It demonstrates the product concept; it does not process uploaded videos.

## The experience

The landing page introduces the product through a working interactive walkthrough:

- **One plant, one identity:** three simulated observations explain why repeated video frames should not become duplicate plant records.
- **Every plant has a place:** a complete field atlas lets visitors inspect four illustrative crop, weed and review samples.
- **Review before action:** ambiguous plants stay visible for human judgment.
- **Take the data with you:** a sample CSV exports labels and normalized image coordinates.
- **Explore the reasoning:** pipeline tabs, research notes and FAQs explain the proposed system and its limits.

The interface supports desktop and mobile layouts, keyboard controls, finite animation, playback controls and reduced motion.

## Proposed pipeline

```text
Phone video
    → Sample frames
    → Segment individual plants
    → Link observations across frames
    → Classify: crop / weed / needs review
    → Human review
    → Plant inventory and field map
```

The proposed architecture explores SAM 3.1 for segmentation, custom motion-aware tracking for identity linking, and Muse Spark for visual classification. These integrations are not connected to the current landing page.

The intended output is a reviewable information layer. Spraying hardware integration and treatment execution are outside the current prototype.

## What the demo data means

All current field artwork is AI-generated illustration. It is not Japanese field footage, WeedMap imagery or measured model output.

The downloadable CSV contains four illustrative records. Coordinates are relative to the example image, not GPS positions or a surveyed field map. The records are not a count of every plant shown.

GreenPoint has not published measured classification accuracy, tracking performance, time savings or pesticide reductions.

## Development

The landing prototype uses **React 19, Vite 6 and CSS**, with self-hosted Sora, Source Sans 3 and IBM Plex Mono fonts, Phosphor icons and Pretext text measurement.

With Node.js 22 or newer installed, run these commands from the project root:

```bash
cd landing
npm ci
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

Open the local preview at `http://localhost:4173/`.

```bash
npm run build
npm run test:sites
```

The build prepares the frontend and Sites-compatible worker package. No model API key is required for the presentation prototype.

## Next milestones

1. Connect a real video-processing path and make failures visible.
2. Evaluate segmentation, identity linking and classification separately on appropriately licensed data.
3. Test representative field videos and uncertainty handling with growers.
4. Establish the mapping and calibration requirements before claiming geographic coordinates.

## Background

- [SAM model documentation](https://dev.meta.ai/docs/overview)
- [Meta model catalog](https://dev.meta.ai/docs/models)
- [WeedMap research paper](https://arxiv.org/abs/1808.00100)
- [Japan’s MIDORI Strategy](https://www.maff.go.jp/e/policies/env/env_policy/midori.html)

These sources provide technical and policy context; they do not establish GreenPoint’s performance.
