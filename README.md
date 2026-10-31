# GreenPoint

**See the field. Plant by plant.**

[Open the live GreenPoint landing](https://greenpoint-vert.vercel.app/)

A phone-first approach to turning a field walk into a reviewable, per-plant weed map.

GreenPoint is designed for Japanese growers and field-service teams managing scattered plots. The idea is simple: record an ordinary phone video, link repeated views of each plant, and give a person a clearer inventory to review.

## Project status

GreenPoint is an early research and hackathon prototype.

| Area | Status |
| --- | --- |
| Interactive landing page | Implemented in the local development workspace |
| Illustrative field atlas and sample CSV | Implemented |
| Field-analysis dashboard | Implemented, with local video previews, evidence review and CSV export |
| Video upload | Local decoding and up to 12 sampled frames per clip implemented |
| Live model inference | Server integration implemented; deployment credentials not configured |
| Plant tracking and classification pipeline | Conservative candidate linking and Meta API transport implemented; real-provider and field validation pending |
| Generic robot/agent MCP | Stateless Streamable HTTP, public discovery/sample tools and token-protected single-frame perception implemented; hardware and real-provider validation pending |
| Public-data evaluation and real-field trials | Planned |

The source is available in [`landing/`](landing/). `/` introduces the product and `/dashboard` opens the field workspace. The deployed workspace currently uses clearly marked illustrative sample records; uploaded videos can be previewed locally. Live analysis requires server credentials.

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

The dashboard integrates SAM 3.1 segmentation and Muse Spark visual classification through a server-only Meta API adapter. Its conservative geometric tracker proposes identities only between closely spaced, unambiguous observations. Sparse views remain separate candidates. Transport and failure paths are covered by tests; real-provider execution and field performance are not yet validated.

The intended output is a reviewable information layer. Spraying hardware integration and treatment execution are outside the current prototype.

## What the demo data means

All current field artwork is AI-generated illustration. It is not Japanese field footage, WeedMap imagery or measured model output. The dashboard sample uses an eight-second static illustration preview with 12 hand-authored records.

The landing CSV contains four illustrative records; dashboard exports contain the current session's records, original model label, effective classification, review status and provenance. Coordinates are relative to source frames, not GPS positions or a surveyed field map. The example records are not a count of every plant shown.

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
npm run test:analysis
npm run test:mcp
```

The build prepares the frontend and Sites-compatible worker package. No model API key is required for the presentation prototype.

Robot and drone agents can use the [MCP endpoint and integration guide](landing/docs/MCP.md). This is frame-level perception with image-space coordinates, not flight control or physical actuation.

## Next milestones

1. Configure server-only `MODEL_API_KEY` and `ANALYSIS_ACCESS_TOKEN` on Vercel, redeploy, then verify a real field clip end to end. See [connection setup](landing/README.md#connect-live-analysis).
2. Evaluate segmentation, candidate identity linking and classification separately on appropriately licensed data.
3. Test representative field videos and uncertainty handling with growers.
4. Establish the mapping and calibration requirements before claiming geographic coordinates.

## Background

- [SAM model documentation](https://dev.meta.ai/docs/overview)
- [Meta model catalog](https://dev.meta.ai/docs/models)
- [WeedMap research paper](https://arxiv.org/abs/1808.00100)
- [Japan’s MIDORI Strategy](https://www.maff.go.jp/e/policies/env/env_policy/midori.html)

These sources provide technical and policy context; they do not establish GreenPoint’s performance.
