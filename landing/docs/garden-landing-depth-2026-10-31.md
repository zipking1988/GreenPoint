# Garden landing: evidence and content decisions

Scope: enrich the existing GreenPoint landing for everyday vegetable gardeners, including older growers and family helpers, ahead of the hackathon submission. Sources checked 31 October 2026. Keep the existing hero and working review flow. No changes to analysis APIs, MCP authentication, tracking or paid model behavior.

## Evidence map

| Source | Supported observation | Product inference and limit |
|---|---|---|
| [Thrive: weeding](https://www.thrive.org.uk/get-gardening/weeding-the-garden) | First shoots can be hard to identify; sight loss and bending can make gardening tasks harder. | Source-linked review could support recognition. It does not perform weeding, establish medical benefit or prove demand. |
| [RHS: common weeds](https://www.rhs.org.uk/weeds/identify-common-weeds) | A weed is unwanted in its location; some plants benefit wildlife. | Keep the gardener's intention in the final decision. A category is not an instruction to remove. |
| [Thrive: getting help](https://www.thrive.org.uk/get-gardening/getting-help-with-your-garden) | Identify tasks for which help is needed, including weeding. | A visual candidate record might help discussion; sharing/collaboration and its benefit are not validated features. |
| [Pl@ntNet](https://plantnet.org/en/) | Picture-based identification and biodiversity citizen science. | Acknowledge established identification tools; no superiority claim. |
| [PictureThis FAQ](https://www.picturethisai.com/faq) | Identifies weeds, supplies removal advice and supports correcting results. | Differentiate the proposed video-to-review workflow, not a fictional absence of competing weed/review features. |

Public gardening anecdotes and earlier trend searches motivated investigation; they are not prevalence estimates or representative older-gardener studies. No market-size, accuracy, pesticide-saving, customer testimonial or labour-saving number is published. No provider calls or additional research credits were consumed for this extension.

## Design decisions

Considered: a research-heavy article; an extension of the selected hybrid with a usable evidence example; a cinematic scroll film. Choose the hybrid extension under the user's delegated selection. The page must earn trust without delaying entry to upload or pretending the model is already validated. Preserve the original hero asset, palette and composition.

Information architecture: hero → sourced need → interactive evidence → interactive workflow → competitor focus → limitations → readiness → FAQs → upload. Navigation offers need/workflow/prototype, and a persistent upload action.

State coverage: workflow uses four ordinary toggle buttons, exactly one pressed, with a polite live panel. No loading/error states are invented because it performs no network calls. Existing evidence supports pending/confirmed/deferred, reset and CSV download. FAQs use native details. The actual workspace owns upload, loading, access failures, partial and complete results.

Journey: recognize a familiar hesitation → understand the source → try a decision → inspect the mechanism → understand limits → choose a local video. Five-second goal is a phone-video garden review; five-minute goal is a defensible understanding of candidate evidence and human control. Long-term adoption and impact remain hypotheses.

Seven design passes: (1) IA: separate jobs for eight sections; direct upload remains visible. (2) States: explicit local/illustrative/pending model behavior. (3) Journey: action before technical depth, no forced tour. (4) Specificity: original botanical image, source-linked GP-007, no fake metrics/card mosaic. (5) Existing system: shared palette/fonts, native React/Pretext. (6) Responsive/accessibility: 320/375/768/1024/1280/1440 checks, keyboard toggles, details, 44px controls, reduced motion. (7) Decision register: preserve hero; enrich content; keep provider validation pending; no paid cinematic video. Decisions authorized by the user's full delegation.

## Demo narrative (three-minute assumption)

- 0:00–0:25: a gardener wants to protect what belongs in a small vegetable bed; sources establish recognition/context problems.
- 0:25–1:15: inspect GP-007, defer it, then confirm a choice; original suggestion remains, export a labeled illustrative record.
- 1:15–1:50: walk through the four stages. SAM segmentation, conservative candidate linking, Muse classification, human review. This explains the integration; it is not real-provider evidence.
- 1:50–2:20: upload a short clip into local preview; explain analysis requires configured access. Never narrate sample artwork as live inference.
- 2:20–3:00: show limits and the pending validation plan. Highest remaining submission risk is real AI validation, not more landing polish.

Before claiming a real AI demo, configure the missing model secrets and finish the budgeted real-clip acceptance plan. Do not substitute this landing for that evidence.
