# Plant workspace redesign — 31 October 2026

Scope: `/dashboard` and `/app`; preserve explicit `?view=video`, `?view=map`, existing perception, review, CSV and MCP. User delegated design decisions, implementation, review fixes, main push and production deployment. All choices below are agent-selected under that delegation, not user ratings of generated options.

## Product and research

Everyday plant owner or judge: select a plant, inspect its source, record missing context, inspect the resulting record and export. The plant-agent story is an explicitly scripted prototype. No model or sensors assess the new journal. AI validation remains unavailable without provider credentials; no paid calls this run.

Observed GreenPoint baseline: map-first `/dashboard` displays Kashiwa weed zones, while landing introduces Milo. The source crop is strong, but this is a different job and entity. Baseline `design/plant-workspace/qa/before-map.png`.

Public scan, 31 October: [Planta](https://getplanta.com/) advertises individual care, organization and journals; [Greg](https://greg.app/) advertises identification and personalized care. These are vendor claims, not independently tested products or proof of demand. [Iowa State Extension](https://yardandgarden.extension.iastate.edu/faq/why-my-houseplant-wilting) explains opposite watering causes can share visible wilting. Inference: a useful agent interaction should expose missing context instead of guessing treatment from appearance. No interviews or frequency estimates. Agent-reach Jina used; Reddit backend unavailable. Planta `/features` returned404, home successfully read.

This week: align entity/workflow, retain photo and note provenance, expose unknowns, make all inputs and exports work. Later: validate persistent memory, real LLM prompts, calibrated perception and repeat visits with actual owners. Deeper research: whether a plant voice improves useful observation rather than novelty.

## What already exists

DESIGN.md and shared palette, self-hosted Sora/Source Sans3/IBM Plex Mono, Phosphor icons, MeasuredCopy Pretext, fictional Milo raster and scripted follow-up helper, Modal native focus trap, HTTP-compatible createId, tab-local video sessions with unload warning, model connection reducer, field map, stateless MCP. Reuse them. Keep code split/lazy for video/map.

## Decisions and information hierarchy

1. Default is a plant workspace; existing field map moves to explicit view=map and remains in navigation. Alternatives: retain unrelated map-first or remove it. Selected: preserve it as secondary because evidence work remains valuable.
2. Seed exactly one fictional Milo; no invented garden, dates, metrics, sensor readings or profile counts. Add-your-own-plant is a real manual journal, clearly separate from Milo simulations.
3. Local profile creation: name, optional plant type/location and optional photo. All remain in current tab. Photo ≤8MB JPEG/PNG/WebP, re-encoded down to1200px. Export includes reduced photo and provenance. No uploads or inference.
4. A soil observation (dry/damp/not checked) and optional note append to selected plant only. Milo changes a scripted follow-up, real profiles display human-entered context without generating advice. Latest30 entries retained per plant, total disclosed; cap12 profiles to bound memory.
5. Export whole workspace as JSON, preserve original image provenance and unknown values. Confirm saved download before clearing dirty state; changes after export invalidate confirmation. beforeunload protects saved-in-tab unexported work. No persistence/backend newly added.
6. Request, Journal, Evidence are conventional pressed buttons with section switching, native focus and clear status. Add plant uses existing modal. Keyboard and mobile first class.

Navigation -> My plants + Add plant | Video lab | Field map | Connections
Main -> plant identity / mode -> Request | Journal | Evidence
Request -> source portrait (desktop left) + request/context/form (right)
Mobile -> compact identity -> request/form -> compact photo/source -> journal via sections

## Interaction states

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Profile/photo | Reading photo, form disabled | Add plant, optional photo clearly absent | File-type/size/decode inline; retry retains text | Named profile selected, inputs reset | No photo still a usable manual journal |
| Observation | Immediate local record | Soil unknown, choose an observation | Native required radio; bounded note | Numbered status and latest context; no treatment | Not checked stays unknown, follow-up open |
| Journal | No network | Clear first-observation action | No silent state mutation | Entries carry time, source and plant ID | Latest30 / total disclosed |
| Export | Download initiated | Seed export valid | Changed snapshot requires fresh export | Explicit saved confirmation | Photo is reduced copy; original remains on device |
| Video/model | Existing cancellable processing | Local preview/sample available | Missingconfig/429/timeout unchanged | Source results/human review | Preserve current partial-run handling |

## Journey storyboard

| Step | Action | Feeling | Design support |
|---|---|---|---|
| 1 | Arrive from landing | Oriented in5s | Same Milo portrait/name, scripted label, one request |
| 2 | Check source | Trust without overclaim | Explicit generated versus userphoto provenance |
| 3 | Choose observation and note | Control | Native visible labels, no care action |
| 4 | Record | Progress | Updated request/context and entry count |
| 5 | Inspect journal/export | Ownership | Per-plant source/time, download and save confirmation |
| 6 | Open video lab | Clear technical boundary | Separate perception label, existing session retained |

5min win is a real local record and opened JSON. Long-term plant memory remains roadmap, not a shipped5year promise.

## Design consultation / implementation spec

Update existing system. Operate surface: calm charcoal canvas with sage botanical source, lime reserved for primary action/selection. Sora540 headings; Source Sans3 body16-18px; mono only timestamps. No charts, decorative card mosaic, glows, fake percentages or chat pretending to call a model. Portrait is visual anchor. Left navigation208px, content max1260px; request split roughly42/58. Four-pixel spacing scale. Use existing CSS token roles, no global landing changes.

Pretext tier: basic prepare/layout through existing MeasuredCopy for request/body text after font readiness and ResizeObserver. React JavaScript output selected under delegation; no parallel vanilla app.

Motion: calm, corporate/premium. Signature cubic-bezier(.2,.7,.2,1); quick150ms, normal280ms, authored420ms. Request update enters6px/opacity, selected observation settles with icon; source/footer remain still as ambient grounding. At most one main region moving. Reduced motion disables transforms/animation. Never hide content behind timing or autoplay.

## Responsive / accessibility

1440: sidebar208 + fluidcontent, portrait and form visible together. 1024: sidebar180, tighter main gap; photo bound independent of text height. 768: horizontal plant/navigation controls and compact two-column source/form. 375: native scroll, topnav wraps, request/form first, optional expandable note, then compact140px photo and source, fullwidth primary action, no horizontal overflow. 320 and200% text zoom also verified. All controls min44px, native radios, labels outside fields, role=status for updates, sufficient token contrast, visiblefocus, skiplink. Section actions work keyboard; dialogs Escape/trap/restore. Long names wrap and min-width0 everywhere.

## NOT in scope

- New LLM/backend/database/sensor/actuation/GPS: credentials and acceptance unavailable, preserve existing interfaces.
- Diagnosis or care schedules: observations do not establish cause.
- Landing redesign: completed approved narrative and hero retained; only workspace entry links may change.
- Public customer claims: no validated demand, outcomes or awards.

## Seven-pass plan-design-review

Scope gate: explicit dashboard page. Initial impression5/10 due product mismatch. Decisions resolved individually by agent under explicit full delegation; no preference questions sent.

| Pass | Before | After | Findings / remedy |
|---|---|---|---|
| 1 Information architecture |5|9|Map/Milo mismatch resolved by plant-first entry and preserved secondarylab/map |
| 2 Interaction states |5|9|Missing real profile/unknown/export states specified above |
| 3 Journey |6|9|Evidence -> context -> journal -> export storyboard now explicit |
| 4 AI slop |7|9|OPERATE; no hardreject hits after removing imaginedmetrics/cards. BrandYES, anchorYES, scanYES, sectionsYES, cardsnecessaryYES(forminteraction), functionalmotionYES, shadowfreeYES |
| 5 Design system |8|9|Reuse colors.primary/background/surface/text/muted/review, typography.body/dashboardDisplay, spacing.unit, rounded.control |
| 6 Responsive/accessibility |6|9|Specific375/768/1024/1440 + keyboard/unknown/error specs |
| 7 Decisions |unscored|resolved|Six choices above; no unresolved design choices |

Overall=min six rated passes:5->9/10 (subjective plan judgment, not measured user validation). External-provider outside design review unavailable in this Codex harness; native independent release review scheduled. No forced model change or external CLI review.

## Implementation tasks

- [x] T1 P1: plant-first router and preserved lab/map navigation; verify route/state survival.
- [x] T2 P1: profile/context/journal/provenance/export helpers and meaningful boundary tests.
- [x] T3 P1: selected mock implementation with fonts/palette/Pretext and finite motion.
- [x] T4 P1: source/render comparison, responsive/keyboard/error/download browser QA and regression suite.
- [ ] T5 P1: independent read-only code review, fix findings, clean archive preview then main production release.

No deferred TODOS.md proposals. AI integration remains the preexisting blocked acceptance gate.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| Design plan | User named dashboard | Align product/workspace |1|Design complete|Six decisions resolved under delegation |
| Eng release | User requested | Correctness/regression |2|Cleared|1P2 hidden-dialog issue fixed and independently rechecked |
| Outside provider | Harness constraint | Extra perspective |0|Unavailable|Not claimed as completed |

VERDICT: DESIGN AND ENGINEERING CLEARED; RELEASE VERIFICATION FOLLOWS THIS COMMIT
NO UNRESOLVED DECISIONS
