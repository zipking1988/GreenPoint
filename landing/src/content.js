export const samplePlants = [
  { id: 'GP-007', label: 'Needs review', x: 51, y: 55, note: 'Keep ambiguous plants in the review queue. A person makes the treatment decision.', action: 'Manual review' },
  { id: 'GP-014', label: 'Weed', x: 68.5, y: 18, note: 'An example weed candidate, flagged for a person to inspect before treatment.', action: 'Treatment review' },
  { id: 'GP-021', label: 'Crop', x: 29.5, y: 46, note: 'An example crop observation retained in the inventory and left untreated.', action: 'Keep in inventory' },
  { id: 'GP-032', label: 'Needs review', x: 44, y: 36.5, note: 'Uncertainty stays visible rather than being forced into a crop or weed label.', action: 'Manual review' },
];

export const pipeline = [
  { verb: 'Segment', name: 'SAM 3.1', short: 'Find individual plants in video frames.', detail: 'Short concept prompts produce boxes and masks for each frame. The real pipeline uses SAM 3.1, with a fixed public-image benchmark and source-pixel evidence.', output: 'Plant masks + observations', url: 'https://dev.meta.ai/docs/overview', link: 'Meta Model API' },
  { verb: 'Link', name: 'Frame or native IDs', short: 'Propose links between nearby observations.', detail: 'Sampled frames use conservative geometric matching. Optional native video sends the selected short clip to SAM for clip-scoped identities. The two real video checks returned zero candidates, so movement identity performance remains unvalidated.', output: 'Candidate links across frames', url: null, link: null },
  { verb: 'Review', name: 'Muse Spark', short: 'Suggest crop, weed, or human review.', detail: 'Muse Spark classifies a representative source crop. Optional operator crop-reference comparisons are experimental: development tests increased crop-as-weed errors. Uncertain plants stay visible; confidence never replaces human judgment.', output: 'A reviewable plant inventory', url: 'https://dev.meta.ai/docs/models', link: 'Meta model documentation' },
];

export const evaluation = [
  { name: 'Detection', metric: '148 / 256 annotated plants matched', status: 'Measured', method: '20 held-out public RGB images; one-to-one box matching at IoU ≥0.5.' },
  { name: 'Weed recognition', metric: '3 / 88 weeds found · 3 / 3 predictions correct', status: 'Target not met', method: 'Uncertain and missed weeds included. Only three positive predictions; limited statistical evidence.' },
  { name: 'Motion tracking', metric: 'Zero candidates in two real clips', status: 'Unvalidated', method: 'Two four-second BoniRob clips. Per-frame semantic labels do not validate identity continuity.' },
];

export const faqs = [
  { q: 'Is the walkthrough running live AI?', a: 'The landing walkthrough uses AI-generated illustrations and a simulated tracking sequence. The dashboard has a server integration for live analysis when its owner configures model access; a separate recorded real Meta run and a 20-image public-data report are available. The weed-recall target was not met; farmer field trials remain pending.' },
  { q: 'How are repeated views linked?', a: 'The dashboard proposes links when consecutive sampled observations have similar position and size. Uncertain matches stay separate. Camera movement, duplicate candidates and incorrect merges need field validation; the interactive example is not a benchmark result.' },
  { q: 'Can this map control a sprayer?', a: 'No. This prototype explores the perception and review layer. It does not operate machinery or prescribe chemicals. Image-relative and path-relative locations come first; usable geographic coordinates require calibration and location data.' },
  { q: 'What data will be used for validation?', a: 'The published check uses five frozen PhenoBench development images and twenty official validation images. Two real Bonn robot-camera clips exercise native video. Their annotation keys are not persistent tracking identities. Public-data results do not establish Japanese farmer or phone-camera performance.' },
  { q: 'Will it recognize my crop or every weed?', a: 'That needs field validation for the crop, growing stage, lighting, and camera angle. The intended labels are crop, weed, and needs review. Species-level identification, disease diagnosis, and guaranteed whole-field coverage are outside the prototype.' },
];
