# Real-world validation materials

These are real stock clips prepared for local testing and demonstration. They are not Japanese field footage, annotated benchmark data, or proof of model performance. Results have not been generated while Meta credentials are unavailable.

| Local clip | Original and creator | Preparation | Intended use |
| --- | --- | --- | --- |
| `reviews/2026-10-31/validation/soybeans-normal.mp4` | [Soybean Crops in the Farmland](https://www.pexels.com/video/soybean-crops-in-the-farmland-6622665/), suellen baker | Source 0.5–6.0 s, scaled to 960 px long edge, H.264, audio removed; output 5.52 s | Normal real-field preview. Crop selection: Soybean. Crop/weed ground truth has not been established. |
| `reviews/2026-10-31/validation/weed-occlusion.mp4` | [Close-up of Farmer Pulling Weeds](https://www.pexels.com/video/close-up-of-farmer-pulling-weeds-10041359/), Los Muertos Crew | Source 1.0–6.5 s, scaled to 960 px long edge, H.264, audio removed; output 5.51 s | Challenge preview with a hand occluding vegetation; planted crop is not specified, so this is not a classification benchmark. |

Both originals are labeled free on their Pexels pages. The [Pexels license](https://www.pexels.com/license/) permits use and modification, subject to its restrictions, including not implying endorsement by identifiable people. The prepared local files are not bundled into the application.

SHA-256: `soybeans-normal.mp4` = `40f260a436100cd0ee6a82b7d77dc59151a20148d34566e594d02e7d7a4ff00e`; `weed-occlusion.mp4` = `b373e0b479432c393e310632d88cc8b86ba1087e9187cb865b934591b59fdbce`.

## Model validation budget

Budget for this validation: $5 total, including promotional credits. No model calls have been made. On 2026-10-31, [Meta's published Standard rates](https://dev.meta.ai/docs/pricing-rate-limits) were $2.50 per 1,000 SAM images and $1.25/$4.25 per million Muse Spark 1.3 input/output tokens. Twelve SAM image calls are $0.03 before classification; this is not a complete run estimate. Classification batches have an output limit of 4,000 tokens and image input cost varies. Before each paid batch, measure its complete input with [Meta's input-token counting endpoint](https://dev.meta.ai/docs/token-counting), reserve the full 4,000 output-token cost, and update a cumulative ledger from actual provider usage. Stop if actual or worst-case remaining cost cannot be determined, or if the next request would exceed $5. Do not automatically retry paid calls.
