// Manual visual anchors in the 1586×992 illustration, not model detections.
// Recheck the plant centres whenever field-map.webp changes.
export const samplePlants = [
  { id: 'GP-007', label: 'Needs review', x: 67.8, y: 49, note: 'Keep ambiguous plants in the review queue. A person makes the treatment decision.', action: 'Manual review' },
  { id: 'GP-014', label: 'Weed', x: 70.4, y: 16.9, note: 'An example weed candidate, flagged for a person to inspect before treatment.', action: 'Treatment review' },
  { id: 'GP-021', label: 'Crop', x: 17.8, y: 41.9, note: 'An example crop observation retained in the inventory and left untreated.', action: 'Keep in inventory' },
  { id: 'GP-032', label: 'Needs review', x: 38.3, y: 35.2, note: 'Uncertainty stays visible rather than being forced into a crop or weed label.', action: 'Manual review' },
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
  { q: 'Is the landing running live AI?', a: 'The real-evidence preview and MCP sequence replay published Meta runs; opening the page makes no new model call. The field artwork and tracking walkthrough are clearly labeled illustrations. New live analysis requires an operator to submit footage with owner-provided model access. The public-data weed-recall target was not met; farmer field trials remain pending.' },
  { q: 'How are repeated views linked?', a: 'Sampled-frame analysis proposes links using position and size; uncertain matches stay separate. Optional native video asks SAM for clip-scoped identities. Both real native-video checks returned zero candidates, so movement identity performance remains unvalidated. The illustrative tracking sequence explains the idea, not measured results.' },
  { q: 'Can a drone or robot use GreenPoint?', a: 'An upper-level agent can request single-frame plant evidence through the generic MCP interface. A recorded Muse run demonstrates actual capability discovery, frame analysis and a human-review decision. Physical robot integration, flight, navigation, GPS mapping and actuation have not been validated. Live frame analysis needs a separate owner-provisioned access token.' },
  { q: 'Can this map control a sprayer?', a: 'No. This prototype explores the perception and review layer. It does not operate machinery or prescribe chemicals. Image-relative and path-relative locations come first; usable geographic coordinates require calibration and location data.' },
  { q: 'Which data have we tested?', a: 'The published check uses five frozen PhenoBench development images and twenty official validation images. Two real Bonn robot-camera clips exercise native video. Their annotation keys are not persistent tracking identities. Public-data results do not establish Japanese farmer or phone-camera performance.' },
  { q: 'Will it recognize my crop or every weed?', a: 'That needs field validation for the crop, growing stage, lighting, and camera angle. The intended labels are crop, weed, and needs review. Species-level identification, disease diagnosis, and guaranteed whole-field coverage are outside the prototype.' },
];
