# GreenPoint: Every plant deserves an agent

User-authorized pivot on31October2026: let plants themselves use AI through an agent that observes, remembers context, asks for care and receives human feedback. Redesign the landing, independently review/fix, push main and deploy Vercel. User delegates design decisions and asks not to pause for preferences.

## Product brief and scope

Audience: plant owners, curious builders and hackathon judges. Memorable thing: a plant asks a useful question and shows the evidence behind it. Core demo: Milo, an illustrative potted tomato, asks for a soil check; a visitor selects a clearly labeled scenario; the request and in-page journal update; the visitor exports the journal. This is a deterministic scripted concept, not an LLM call, real sensor reading or plant consciousness. Existing perception workspace remains separate and accessible; no new provider, database, device integration or autonomous watering.

Visual direction: three independently generated concepts compared. A/The Living Network selected by agent under explicit delegation. Keep original botanical hero raster and charcoal/sage/lime brand; Sora display, Source Sans3 body and IBM Plex Mono data. Source: design/plant-agent/selected.webp. Retain original hero composition as a user override to generated concept; use one hero request link and potted tomato source image below. Any original-image plant tags are illustrative, not identity tracking.

## Research and value

[Plantbot](https://arxiv.org/abs/2509.05338) explores LLM-mediated plant/environment/robot interaction. [FLORA](https://www.lumalien.com/flora) is an open-source sensor/voice plant companion with local memory; do not claim first-ever plant agents or that competitors lack memory. [RHS](https://www.rhs.org.uk/plants/types/houseplants/how-to-help-a-poorly-houseplant) and [Iowa State Extension](https://yardandgarden.extension.iastate.edu/faq/why-my-houseplant-wilting) explain that context matters and similar symptoms may have different causes. Product inference: the useful request is for missing evidence, not automatic watering. Sources support design rationale, not GreenPoint outcomes or demand. No customer interviews claimed.

## Information architecture

Hero/agent invitation → Milo request and evidence → Observe/Remember/Ask/Review loop → perception foundation → why this direction and related work → readiness/current versus future → FAQs → invitation. Every section has one job. Existing dashboard stays unchanged. Agent demo is primary; perception workspace secondary.

## States and interaction contract

- Hero: visible content by default, finite entrance; primary anchor focuses Milo heading and respects reduced motion. Mobile request moves below main copy, never overlaps CTA.
- Demo initial: soil unknown; scripted request asks for check. Scenario form requires selection, native validation. Dry/damp/not-checked choices alter request. All records marked visitor-selected scenario with actual event timestamp and fictional plant identity. Never call scenario data real sensor/human field measurement.
- Journal: newest-first event list, bounded to30entries with explicit retained-entry notice; reset clears only landing demo, deterministic sequence starts fresh. ExportJSON includes schema version, fictional plant, scripted mode, generated image source, typed records, current request, pending status, timestamp and non-actuation flags. Export creates file, no external transmission.
- Unknown/deferred stays pending; dry/damp records context but still asks follow-up. No automatic treatment or success-as-recovery claim.
- Evidence uses native details and original full image. Current request uses polite live text; focus stays in form on submit. Reset visible only after recorded scenario; always returns focus to scenario select.
- Loop: four buttons control one visual/text region with pressed states and meaningful static content; no simulated network spinner.
- Navigation: anchors, menuEscape/focus restore, skip link. FAQs native details. Current route remains '/'.

## Responsive and motion specification

1440:1280pxcontent, hero fullbleed; one floating request right; demo two columns with full4:5photo and separate request surface.1024: narrower hero title/request; demo two columns if readable.768: request becomes document flow, demo single image/panel, journal below.375/320:48px controls, large copy, wrap buttons into full rows, no horizontal overflow. Test keyboard, native validation, form submit/reset, all branches, actualJSON, menu, details, footer motiontoggle, existing video upload and MCP.

Premium motion: quick150ms, normal350ms, hero700ms, cubic-bezier(.2,.7,.2,1); hero primary/title, secondary/CTA, ambient/photo settle run finitely. Demo feedback enters by6px+opacity. No content hidden waiting for scroll. Reduced motion disables transformations/animations and smoothscroll. Native scrolling retained.

## Design review decisions

1. IA8→9: make one plant-originated question primary; put mechanism/readiness after actual interaction.
2. States7→9: add requiredscenario input, unknown branch, boundedjournal, JSONprovenance/reset, leave requests pending.
3. Journey8→9: surprise → inspect → respond → understand → explore existing foundation. No claim of actual plant emotion.
4. Specificity8→9: selected botanical fullbleed composition plus tangible request; no testimonials/metrics/cardmosaic or vaguechatbothero. Mock's unlabeled diagnostic statement replaced with explicit authored scenario.
5. System9→9: existing sharedfonts/tokens retained, newlyselectedimage and one interactive request surface.
6. Responsive7→9: in-flow mobilehero request, singlecolumn demo, keyboard native controls,44+px targets, visible reducedmotion. Formal accessibility testing remains future work.
7. Decision register: userdelegatedselection; Aselected; preserveoriginalhero; scripteddemolabeled; noautonomouscontrols; preserveperceptionAPI; noextra paidvideorenders.

## Film branch

scroll-world bootstrap checked: Monid CLI0.1.7 has no active API key; Higgsfield1.1.26 workspace listing fails with authlogin hint. No render calls or credits consumed. Full seamless cinematic film is unavailable in this run; implement the selected still-based botanical narrative with finite motion and native scroll. Do not call that a generated scroll-world film.

## Hackathon strategy

Assume a3minute pitch until published submission cap is verified. Strongest narrative: a plant asks for the evidence it lacks. Keep the demo observable and executable. Existing model integration/perception does not validate a plant-careLLM. Biggest remaining risk is provider validation. No winner/novelty/accuracy guarantee. Show source, uncertainty and current/future status.

## GSTACK REVIEW REPORT

| Runs | Status | Findings |
|---|---|---|
| Primary7pass planreview | complete | Scope/state/mobile/truthfulness decisions incorporated under explicit delegation |
| Visual exploration | complete |3independentconcepts; Aselected |
| External model voice | unavailable | CurrentCodexharness; no external process or coverage claimed |

VERDICT: ready for landing implementation; real-provider acceptance remains separate.
NO UNRESOLVED DECISIONS
