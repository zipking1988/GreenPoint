# GreenPoint

**See what grows. Plant by plant.**

[Open the live GreenPoint landing](https://greenpoint-vert.vercel.app/)

A phone-first prototype for turning a short garden video into a reviewable list of plant candidates, with image evidence and human decisions.

The current product hypothesis is everyday vegetable gardeners, including older growers and the people who help them. Start with an ordinary phone video, inspect the source behind a suggestion, then keep, mark or defer a plant. Recognition cannot remove weeds or solve physical strain by itself; usability and actual benefit still need testing with gardeners.

## Project status

GreenPoint is an early research and hackathon prototype.

| Area | Status |
| --- | --- |
| Garden landing and illustrative review example | Implemented, with source-linked evidence and an actual sample CSV |
| Illustrative field-map workspace | Implemented as a separate sample |
| Field-analysis dashboard | Implemented, with local video previews, evidence review and CSV export |
| Video upload | Local preview up to two minutes; analysis accepts clips up to six seconds and 12 sampled frames |
| Live model inference | Server integration implemented; deployment credentials not configured |
| Plant tracking and classification pipeline | Conservative candidate linking and Meta API transport implemented; real-provider and field validation pending |
| Generic robot/agent MCP | Stateless Streamable HTTP, public discovery/sample tools and token-protected single-frame perception implemented; hardware and real-provider validation pending |
| Public-data evaluation and real-field trials | Planned |

The source is available in [`landing/`](landing/). `/` introduces the product; its primary upload action opens `/dashboard?view=video&upload=1`. `/dashboard?view=video` opens video review, while `/dashboard` retains the illustrative field map. Sample records are clearly labeled; uploaded videos can be previewed locally. Live analysis requires server credentials.

## The experience

The landing page introduces the product through an interactive garden example:

- **One plant, the evidence, your decision:** GP-007 connects a source rectangle to a crop of the same image.
- **Review before action:** keep and weed decisions are confirmed; deciding later is deferred. The original uncertain suggestion stays visible.
- **Take the record with you:** an actual sample CSV exports illustrative provenance, original suggestion, human decision and normalized image coordinates.
- **Start with your video:** upload actions enter the six-second analysis workflow directly. Longer videos up to two minutes are preview-only.
- **Understand the limits:** prototype details describe current behavior, pending validation and how sampled frames are sent for configured live analysis.

The interface supports desktop and mobile layouts, keyboard controls, finite animation and reduced motion. The video workspace retains playback controls.

## Proposed pipeline

```text
Phone video
    → Sample frames
    → Segment individual plants
    → Link observations across frames
    → Classify: crop / weed / needs review
    → Human review
    → Reviewable plant candidate inventory
```

The dashboard integrates SAM 3.1 segmentation and Muse Spark visual classification through a server-only Meta API adapter. Its conservative geometric tracker proposes identities only between closely spaced, unambiguous observations. Sparse views remain separate candidates. Transport and failure paths are covered by tests; real-provider execution and field performance are not yet validated.

The current output is a frame-based, reviewable information layer. A geographic field map is a future goal. Spraying hardware integration and treatment execution are outside the current prototype.

## What the demo data means

All current field artwork is AI-generated illustration. It is not Japanese field footage, WeedMap imagery or measured model output. The dashboard sample uses an eight-second static illustration preview with 12 hand-authored records.

The landing CSV contains one illustrative garden record; dashboard exports contain the current session and run IDs, each candidate's source, original model label, effective classification and review status. Landing, video and map examples have separate identity/decision scopes. Coordinates are relative to source frames, not GPS positions or a surveyed field map. Example records are not a count of every plant shown.

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
3. Test representative garden videos and uncertainty handling with gardeners, including older growers and family helpers.
4. Establish the mapping and calibration requirements before claiming geographic coordinates.

## Background

- [SAM model documentation](https://dev.meta.ai/docs/overview)
- [Meta model catalog](https://dev.meta.ai/docs/models)
- [WeedMap research paper](https://arxiv.org/abs/1808.00100)
- [Thrive: weeding the garden](https://www.thrive.org.uk/get-gardening/weeding-the-garden)
- [RHS: identifying common weeds](https://www.rhs.org.uk/weeds/identify-common-weeds)

These sources provide technical and gardening context; they do not establish GreenPoint’s performance or validate consumer demand. Earlier Japan-specific business hypotheses in `profile.md` are retained as historical exploration.
