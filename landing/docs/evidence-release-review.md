# Evidence sprint implementation review / 2026-11-03

Scope: tracked changes and new source/assets relative to `868c1ab`, including API validation, native media parsing, MCP perception, agent boundary, shared browser state, data provenance, benchmark scripts and publication artifacts. This is the implementation review and local release verification; post-deployment checks are recorded separately in the development workspace.

## Findings resolved

- **Recorded-image reruns sent a URL to the JPEG-only API.** Browser regression reproduced the rejection. Reruns now materialize a bounded JPEG and use those same source pixels for segmentation and classification. A new real run completed with seven candidates; the old run and its human decisions remained separate.
- **Map-only review had no unload warning before Video mounted.** Dirty-session protection now lives in the shared session store. Both workspaces retain version-specific CSV save confirmation; decisions made after export require another export.
- **Best-frame masks could leak onto an observation without a mask.** Observed plants use only the displayed observation's box and mask. Tests verify missing observations disappear and a missing current mask stays null. The connector also updates when the same ID moves between source frames.
- **Empty recorded exports lost provenance.** Run-summary rows retain the recorded flag, source attribution and identity method. A regression covers a zero-candidate native run. Real native-video replay correctly credits SAM alone when Muse was never invoked.
- **Invalid references could reach a paid provider call.** MCP fully decodes and bounds an optional reference before segmentation. A test proves malformed JPEG references cannot trigger billing. Native MP4 metadata checks include coded/displayed dimension agreement, orientation, duration, frame rate, frame count, codec and size.
- **Agent output could add undeclared decision fields.** Final decisions now admit only the specified keys, known evidence IDs and three review-only next steps. Tool names, frame handles, call counts and turns are bounded. A post-deployment regression exposed an incomplete terminal-answer check: discovery and perception are now offered in order, the final answer uses strict structured output, and a 4,000-token allowance avoids the overly short previous cap. Incomplete answers retain distinct diagnostics. The repaired loop passed a real production MCP retest. A partial/limited result cannot support a no-candidates claim.
- **Development failures could interrupt evaluation instead of counting.** Failed classification output remains cached as partial/uncertain, with full unknown-cost reservation. No automatic retry or removal from the denominator. Selection was frozen before the twenty evaluation images.
- **Source crops could distort a wide image.** Crop-window geometry now preserves source aspect ratio. Source attribution from a replay remains nested as historical provenance on reruns rather than presenting the previous input hash as a new input hash.

## Verified locally

- 62 automated checks: analysis, MCP protocol/authentication, map geometry, Meta probe, media/evidence, budget/agent boundaries and Sites packaging.
- Production build and Sites client/server/hosting artifacts generated successfully.
- Browser: genuine video upload/preview; explicit full-clip native transfer; native completion with zero candidates; real single-frame rerun; optional reference prompt and baseline skip.
- Map → defer GP-001 → Video inventory → Map: the same recorded session retained its decision. CSV preserved `uncertain`, original `weed`, `deferred`, source and run identity. Downloaded file was inspected; no invented farmer feedback or time-saving result.
- Desktop source connector and mobile evidence at 390×844; temporary viewport restored. Original charcoal/sage palette and illustrative field layout remain.
- Credential-value scan: 152 publishable files and 49 generated assets, zero matches for configured secret values. Ignored local environment files are excluded from Git.

## Material product limits retained

Twenty-image evaluation: 3/88 weed recall, 3/3 weed predictions correct, 0/168 crops called weed, 93/158 uncertain. Weed-recognition target failed. Two real native-video excerpts returned no candidates, so successful movement tracking is not claimed. No Japanese phone-camera/farmer validation, GPS, metric area, hardware actuation, measured time saving or pesticide reduction. These are visible in the product and full validation report.
