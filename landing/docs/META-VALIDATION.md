# First real Meta model check

The first real field-image check through SAM 3.1 and Muse Spark passed on 2026-11-03; see the [validation record](meta-live-validation-2026-11-03.md) for results and limitations. This guide describes how to reproduce the check. A local ERFNet experiment is an agricultural comparison baseline, not a Meta integration or evidence of hackathon eligibility.

## Prepare without credits

From `landing/`, use Node 22+ and the existing installed dependencies:

```bash
npm run meta:probe -- /absolute/path/to/field.png --crop "Sugar beet"
```

This defaults to local preflight, even if `MODEL_API_KEY` exists. It makes **zero network requests**, checks/normalizes the RGB image, and saves `input.jpg` and `report.json` in a new temporary directory. `--out /absolute/path/to/new-directory` selects a persistent output directory; it must not already exist. Do not put sensitive footage or outputs in public assets or commit them accidentally.

The crop is the known planted crop, supplied by the operator. Input must be a decodable local image under 20 MB / 30 million pixels. The uploaded JPEG is orientation-normalized and resized to at most 1280 pixels per axis; the existing API byte/dimension bounds still apply. Reference annotations are separate evidence and must never be passed as the RGB input. Source and exact prepared-image hashes are recorded for reproducibility.

## Run only after access is ready

Configure `MODEL_API_KEY` through your normal server-side secret mechanism, and verify available Meta credits or a spending budget in the provider dashboard. Do not paste credentials into chat or command arguments. The runner reads the process environment; Node can load a local ignored `.env` using `node --env-file=.env scripts/meta-probe.mjs …`. Never prefix this key with `VITE_`.

```bash
npm run meta:probe -- /absolute/path/to/field.png --crop "Sugar beet" --live
```

`--live` explicitly sends the prepared image and candidate crops to Meta. It can incur charges. One execution performs at most one SAM image request plus two Muse Spark classification requests for at most 16 candidates, without automatic retries. A shared 110-second deadline bounds model work. The runner does not read credit balance or claim a dollar cost for live runs.

It calls the same `analyzeRobotFrame` / `analyze` implementation used by the deployed MCP service, directly in the local process. It does **not** test Vercel HTTP authentication, browser video decoding, cross-frame association, or a physical robot. The direct local runner needs only the provider key. Dashboard deployment separately requires `ANALYSIS_ACCESS_TOKEN`; MCP deployment separately requires `MCP_ACCESS_TOKEN`.

## Inspect evidence

- `input.jpg`: exact RGB image submitted to segmentation.
- `report.json`: source/prepared-image hashes, planted crop, model requests, statuses and validated candidate output. No authorization headers, API keys or full base64 request bodies are saved.
- `candidates.png`: same-image candidate boxes colored sage for crop, coral for weed and amber for uncertain. These are boxes, not pixel-mask exports. All candidates still require human review.

`verified_models` records successfully parsed and validated outputs, not just HTTP 200. An empty SAM result yields `no_candidates` and does not claim Muse Spark was verified. Classification failure stays `partial` with unknown original labels retained. Incomplete/failed/empty live runs exit unsuccessfully so they cannot masquerade as a complete two-model demo. Controlled test fixtures are transport tests, never real model evidence.

For the first run, use the same real PhenoBench sugar-beet RGB frame as the ERFNet comparison. Inspect false positives and missed plants against the separate annotation, then expand to additional independently selected images before making any accuracy claim. The initial frame's split is unverified and could overlap the baseline's training data. Dataset/derived artifact attribution: PhenoBench, Weyler et al. (2024), CC BY-SA 4.0; see <https://www.phenobench.org/dataset.html>.

## Milestones

1. Both Meta models return validated output on a real field image; preserve all errors and uncertainty.
2. Check more independently selected crop/weed images. Establish evaluation split and report failures before estimating accuracy.
3. Use a genuine short field video to test upload → sampled frames → candidate linking → human review → CSV. Label any synthetic camera motion as synthetic; a repeated still image is not a tracking test.
4. Verify the same flow on Vercel and record a reproducible demo. A source-frame inventory is not a GPS field map or a treatment command.

Official references: [Meta models](https://dev.meta.ai/docs/overview), [pricing](https://dev.meta.ai/docs/pricing-rate-limits), [hackathon overview](https://dev.meta.ai/events/global-hackathon). The public event overview also mentions Meta open-weight models; final eligibility must follow the accepted Official Rules, not an inference from this guide.
