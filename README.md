# GreenPoint

**See the field. Plant by plant.**

[Open the live GreenPoint landing](https://greenpoint-vert.vercel.app/)

A phone-first approach to turning a field walk into a reviewable inventory of plant candidates.

The farmer-focused experience was restored on 2026-11-01 using release `409e71d` as the visual and product reference. `/dashboard` opens the field map, and `/dashboard?view=video` opens field-video review. See the [restoration checks](landing/docs/farmer-restoration-2026-11-01.md).

GreenPoint is designed for Japanese growers and field-service teams managing scattered plots. The idea is simple: record an ordinary phone video, link repeated views of each plant, and give a person a clearer inventory to review.

## Project status

GreenPoint is an early research and hackathon prototype.

| Area | Status |
| --- | --- |
| Interactive landing page | Implemented in the local development workspace |
| Illustrative field atlas and sample CSV | Implemented |
| Field-analysis dashboard | Implemented, with local video previews, evidence review and CSV export |
| Video upload | Local preview up to two minutes; ≤6s/12 snapshots, or explicit native-video opt-in (H.264 ≤2 MB) |
| Live model inference | Real SAM 3.1 and Muse Spark single-frame smoke check passed on 2026-11-03; private server credentials required |
| Plant tracking and classification pipeline | Sampled-frame matching and optional native video implemented; two real native clips returned zero candidates; movement identities unvalidated |
| Generic robot/agent MCP | Stateless Streamable HTTP, public discovery/sample tools and token-protected single-frame perception implemented; physical hardware validation pending |
| Public-data evaluation | Frozen 5 development / 20 validation images complete; weed-recall target failed; farmer trials pending |

The source is available in [`landing/`](landing/). `/` introduces the product and `/dashboard` opens the field workspace. The workspace opens a labeled recorded real Meta run on public PhenoBench RGB imagery; illustrative layouts remain selectable; uploaded videos can be previewed locally. Live analysis requires server credentials.

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
    → Reviewable plant candidate inventory
```

The dashboard integrates SAM 3.1 segmentation and Muse Spark visual classification through a server-only Meta API adapter. Its conservative geometric tracker proposes identities only between closely spaced, unambiguous observations. Sparse views remain separate candidates. A real Meta single-frame check on 2026-11-03 returned 12 candidates: 1 crop and 11 uncertain, in about 22 seconds. This establishes integration, not reliable weed identification or field performance. See the [validation record](landing/docs/meta-live-validation-2026-11-03.md).

The current output is a frame-based, reviewable information layer. A geographic field map is a future goal. Spraying hardware integration and treatment execution are outside the current prototype.

## What the demo data means

Landing and illustrative sample artwork is AI-generated. Separately labeled recorded real runs use public PhenoBench imagery and Bonn Sugar Beets 2016 footage under CC BY-SA 4.0. The generated artwork is not field footage or measured model output. The illustrative dashboard sample uses an eight-second static illustration preview with 12 hand-authored records.

The landing CSV contains four illustrative records; dashboard exports contain the current session and run IDs, each candidate's source, original model label, effective classification and review status. Coordinates are relative to source frames, not GPS positions or a surveyed field map. The example records are not a count of every plant shown.

The small frozen public-data evaluation matched 3 of 88 annotated weeds (3.4% recall), with 3/3 weed predictions correct and 0/168 crops called weed. Only three positive predictions is insufficient evidence for reliable precision. Target gates failed. Tracking performance, farmer time savings and pesticide reductions have not been established. See [the complete result](https://greenpoint-vert.vercel.app/validation.html) and [demo script](landing/docs/DEMO.md).

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
npm run test:map
npm run test:evidence
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
