# Evidence sprint / 2026-11-03

Approved scope: farmer close-range scouting, public RGB/reference data, one operator-confirmed crop reference, optional explicitly disclosed short-video transfer to Meta, real source-frame map, tool-using MCP agent, and team workflow checks. Budget: at most $10; stop new experiments at $8 and reserve the remainder for regression. No GPS, treatment, fabricated farmer feedback or pesticide-saving claims.

Sequence: freeze manifest → compare baseline/context/reference on 5 development images → select once → evaluate 20 official validation images → exercise genuine moving RGB video → publish a labeled recorded real run → complete shared map/video review → agent and browser checks → code review and fixes → tests → GitHub main → Vercel → production verification. No evaluation labels are model input. Dataset annotations do not validate cross-frame identity.

References: PhenoBench (Weyler et al., 2024), CC BY-SA 4.0; Sugar Beets 2016 (Chebrolu et al., 2017), CC BY-SA 4.0. Video sample repository pinned to `0763cbbd251701c97f0c5fc7eee999af1a929afd`. See `scripts/freeze-benchmark.py` for deterministic selection and artifact hashes.

Metrics must include missed/uncertain objects rather than discarding them. Target gates: weed precision ≥90%, recall ≥60%, crop→weed error ≤5%; results below these gates remain an assisted review prototype and are reported plainly.


Observed outcome: baseline selected before evaluation. On twenty held-out images, 158 candidates matched 148 of 256 annotated plants at box IoU 0.5. Weed predictions: 3 correct / 3 predicted; recall 3/88 (3.4%); crop-as-weed 0/168; 93/158 uncertain. The recall gate failed. Development reference comparison produced 2 correct weeds / 6 predictions and 4/40 crops called weed, with one incomplete classification response retained as a partial image. Both four-second real native-video excerpts returned zero candidates. These limitations are published visibly in the product.

The default recording is the first frozen evaluation image with a model weed prediction, with the first evaluation image and empty native-video run also selectable. All twenty evaluation cases remain in the report; no result was removed to improve the displayed metric. Demo selection does not alter the frozen pipeline or score.

Delivery includes a reproducible manifest, benchmark runners, a labeled real Meta replay, same-session map/video review, optional experimental reference and native modes, real Muse→MCP trace, operator checklist, 180s and 60s scripts. No external farmer study, measured time saving, narrated final contest video or portal submission has been completed automatically.
