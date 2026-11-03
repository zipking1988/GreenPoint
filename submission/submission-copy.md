# GreenPoint 英文提交文案

以下三段对应官方提交表单的三个文本字段。分别复制标题下的英文正文。

## Project Description

GreenPoint makes plant judgments inspectable: source pixels, model suggestions, human decisions, and software-agent requests stay connected to evidence.

Designed for growers and field-service teams reviewing scattered plots, the online workspace uses SAM 3.1 for plant regions and Muse Spark 1.3 for structured visual suggestions. Select a candidate, inspect a crop from that same source image, keep it for review, and export a CSV preserving the original label, human status, source, and run identity. A separate actual Muse-to-MCP trace demonstrates capability discovery, authenticated frame perception, and a human_review response citing evidence IDs.

During the Hackathon, we also built a working local agricultural recognition prototype using published PhenoBench detector weights. We selected settings on 20 calibration images, froze them, and evaluated 40 additional images containing 196 annotated weeds. Against our previous experimental SAM/ERFNet hybrid on those same images, precision rose from 76.1% to 96.7%, recall stayed near 61%, and unmatched weed flags fell from 37 to 4. The agricultural branch runs locally and is not deployed into the online Meta flow. The smallest targets remain difficult: the selected detector recovered 19 of 70 weeds at 32 pixels or smaller.

The online demo opens clearly labeled recordings of real Meta inference on public data; review interactions work without a model key. Fresh Meta inference requires authorization. These are public sugar-beet-domain results, not independent-farm validation. Positions are source-image coordinates; motion tracking, farmer outcomes, GPS, and physical treatment remain unvalidated or unconnected.

Track: Indie Developer. Theme: Build for Your World.
Product: https://greenpoint-vert.vercel.app/dashboard
Published Meta baseline: https://greenpoint-vert.vercel.app/validation.html
New agricultural experiment: https://greenpoint-vert.vercel.app/agricultural-research.html
Three-minute demo: https://greenpoint-vert.vercel.app/demo.html
Source: https://github.com/zipking1988/GreenPoint

## Describe your use of Meta products to build the submitted project

GreenPoint uses SAM 3.1 and Muse Spark 1.3 through Meta Model API, with Muse serving as both a visual interpreter and a tool-using software agent.

SAM proposes plant regions and masks tied to source pixels. Muse inspects bounded visual crops and returns structured crop, weed, or uncertain suggestions with reasoning. Our review workspace connects that evidence to separate human decisions and traceable CSV exports. Credentials stay server-side, and fresh inference requires operator authorization. The default recorded examples do not start new inference on page load.

Muse also calls our Streamable HTTP MCP server. Its published actual trace shows greenpoint_capabilities, an authenticated greenpoint_analyze_frame request returning seven candidates, and a human_review decision citing GP-001 and GP-007. The agent recording and workspace example are separate inference runs; browser-local review state is not synchronized into MCP. No physical device is controlled.

We measured the limitations rather than treating integration as accuracy. The published online Meta baseline found 3 of 88 annotated weeds on 20 frozen validation images. That finding motivated a separate local agricultural expert experiment. Its selected whole-frame detector reached 96.7% weed precision and 60.7% recall on 40 additional images after calibration on 20 different images. Those new figures belong to the local pretrained agricultural detector, not to SAM or Muse, and the new branch is not yet deployed.

Sampled-frame review and conservative geometric association are implemented. Native SAM video is an explicit opt-in; two genuine moving clips returned zero candidates, so motion identity remains unvalidated. We retain original responses, hashes, scoring, failures, and scope boundaries.

## Why are Meta's models important to your solution?

GreenPoint needs localized visual evidence, structured interpretation, and an agent that can request perception. Meta's stack provides those capabilities in the working online review flow.

SAM 3.1 supplies plant regions and masks tied to source pixels. Muse Spark interprets those crops and returns structured suggestions. The reviewer can inspect the exact source and retain an independent decision. Muse also discovers and calls our MCP tools, turning frame perception into evidence that another software agent can request and cite.

These are two concrete paths through the same perception service: a person inspects a candidate in the workspace, or a Muse agent requests frame evidence and returns a bounded human_review step. The published real tool trace demonstrates capability discovery, perception, evidence IDs, and the final structured response.

Our agricultural experiments address the recognition gaps we measured. The domain-specific pretrained detector is a separate local prototype; its results do not change the published Meta baseline or imply that Meta trained the agricultural weights. Meta remains central to the deployed perception, interpretation, and agent-evidence interface, while the research branch tests how a specialized expert could strengthen it.
