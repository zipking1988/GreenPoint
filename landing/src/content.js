export const samplePlants = [
  { id: 'GP-007', label: 'Needs review', x: 51, y: 55, note: 'Keep ambiguous plants in the review queue. A person makes the treatment decision.', action: 'Manual review' },
  { id: 'GP-014', label: 'Weed', x: 68.5, y: 18, note: 'An example weed candidate, flagged for a person to inspect before treatment.', action: 'Treatment review' },
  { id: 'GP-021', label: 'Crop', x: 29.5, y: 46, note: 'An example crop observation retained in the inventory and left untreated.', action: 'Keep in inventory' },
  { id: 'GP-032', label: 'Needs review', x: 44, y: 36.5, note: 'Uncertainty stays visible rather than being forced into a crop or weed label.', action: 'Manual review' },
];

export const pipeline = [
  { verb: 'Segment', name: 'SAM 3.1', short: 'Find individual plants in video frames.', detail: 'Short concept prompts produce boxes and masks for each frame. Image-based segmentation is the proposed approach for dense plant scenes.', output: 'Plant masks + observations', url: 'https://dev.meta.ai/docs/overview', link: 'Meta Model API' },
  { verb: 'Link', name: 'Custom tracking', short: 'Connect repeated views of the same plant.', detail: 'Camera-motion compensation predicts where a plant will appear next. Matching and track lifecycle rules turn repeated detections into one identity.', output: 'One identity across frames', url: null, link: null },
  { verb: 'Review', name: 'Muse Spark', short: 'Suggest crop, weed, or human review.', detail: 'A representative plant view and crop context inform the proposed classification step. Ambiguous plants remain uncertain; model confidence never replaces a person’s judgment.', output: 'A reviewable plant inventory', url: 'https://dev.meta.ai/docs/models', link: 'Meta model documentation' },
];

export const evaluation = [
  { name: 'Segmentation', metric: 'Recall & mask quality', method: 'Compare detections and masks against labeled public images.' },
  { name: 'Tracking', metric: 'Duplicates & incorrect merges', method: 'Test whether repeated views stay one identity without combining neighboring plants.' },
  { name: 'Classification', metric: 'Errors & abstentions', method: 'Report crop/weed decisions alongside the plants sent for human review.' },
];

export const faqs = [
  { q: 'Is the walkthrough running live AI?', a: 'This website is an interactive concept, with AI-generated field illustrations and a simulated tracking sequence. The proposed model pipeline is not connected to the website. Evaluation results will be reported separately when measured.' },
  { q: 'What makes the tracking step different?', a: 'A moving camera can see the same plant in many frames. The planned tracker compensates for camera movement and associates plant observations across frames, so a repeated view does not become a new plant. The interactive example explains that idea; it is not a benchmark result.' },
  { q: 'Can this map control a sprayer?', a: 'No. This prototype explores the perception and review layer. It does not operate machinery or prescribe chemicals. Image-relative and path-relative locations come first; usable geographic coordinates require calibration and location data.' },
  { q: 'What data will be used for validation?', a: 'The evaluation plan includes WeedMap and AgML agricultural datasets, subject to their licenses. Sliding-window sequences can test tracking under known camera motion. Synthetic sequences will be labeled, and instance-level reference identities are needed to measure deduplication. Real-field testing is a separate next step.' },
  { q: 'Will it recognize my crop or every weed?', a: 'That needs field validation for the crop, growing stage, lighting, and camera angle. The intended labels are crop, weed, and needs review. Species-level identification, disease diagnosis, and guaranteed whole-field coverage are outside the prototype.' },
];
