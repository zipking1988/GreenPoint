# GreenPoint

**Every plant deserves an agent.**

[Open the live GreenPoint landing](https://greenpoint-vert.vercel.app/)

GreenPoint explores what happens when plants have AI agents: observations become context, context becomes a question, and people help decide what care makes sense.

The landing’s fictional tomato, Milo, demonstrates this idea through a clearly labeled scripted request, three imagined soil-check scenarios and an exportable in-page journal. It does not call an LLM, read sensors or operate equipment. Real plant-agent reasoning and persistent memory are future work. The existing phone-video perception workspace supplies a separate foundation for reviewable plant evidence.

## Project status

GreenPoint is an early research and hackathon prototype.

| Area | Status |
| --- | --- |
| Plant-agent landing and Milo concept | Implemented scripted scenarios, evidence disclosure and JSON journal export; no LLM or sensors |
| Plant workspace | Implemented tab-local personal profiles, optional resized photo, observations, provenance and JSON export; manual records, no AI assessment |
| Persistent plant agents and tools | Planned; not implemented or validated |
| Illustrative field-map workspace | Implemented as a separate sample |
| Field-analysis dashboard | Implemented, with local video previews, evidence review and CSV export |
| Video upload | Local preview up to two minutes; analysis accepts clips up to six seconds and 12 sampled frames |
| Live model inference | Server integration implemented; deployment credentials not configured |
| Plant tracking and classification pipeline | Conservative candidate linking and Meta API transport implemented; real-provider and field validation pending |
| Generic robot/agent MCP | Stateless Streamable HTTP, public discovery/sample tools and token-protected single-frame perception implemented; hardware and real-provider validation pending |
| Public-data evaluation and real-field trials | Planned |

The source is available in [`landing/`](landing/). `/` introduces the product; its primary action explores Milo and its secondary action explains the agent idea. The separate perception lab is linked from its own section. `/dashboard?view=video` opens video review, while `/dashboard` and `/app` open the plant workspace. The illustrative field map remains at `/dashboard?view=map`. Sample records are clearly labeled; uploaded videos can be previewed locally. Live analysis requires server credentials.

## The experience

The landing introduces a plant-originated request: “Could you check my soil?” Visitors can inspect the authored evidence, select an imagined soil scenario, see a follow-up and export a journal that explicitly labels the simulation. The record separates fictional identity, generated image, scripted request and visitor-selected context. All branches keep human follow-up pending.

Milo’s memory is page-local and bounded to the latest 30 scenario entries, with the total count disclosed. Leaving resets it; exporting preserves a JSON copy. It is independent of dashboard sessions, CSV review and MCP.

The landing frames a specific care task: a photograph shows one part of the situation, while a person supplies context. On phones, Milo’s request and native soil-scenario choices appear before the compact portrait. A repeated submission updates an entry count so both visible and assistive feedback remain clear. The same fictional plant identity stays attached to the story and export; this does not establish real tracking or persistent agent identity.

The interface supports desktop/mobile, keyboard controls, finite animation and reduced motion. The original botanical hero is retained. The existing video workspace and its playback controls remain available through the perception links.

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

The landing JSON journal contains the explicitly fictional Milo scenario history; dashboard CSV exports contain the current session and run IDs, each candidate's source, original model label, effective classification and review status. Landing, video and map examples have separate identity/decision scopes. Coordinates are relative to source frames, not GPS positions or a surveyed field map. Example records are not a count of every plant shown.

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
npm run test:map
npm run test:plant-agent
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
