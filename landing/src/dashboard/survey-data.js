export const SURVEY_IMAGE = '/assets/survey-field.webp';
export const REVIEW_STORAGE = 'greenpoint-survey-review-v1';

// Hand-authored image-relative demonstration regions, never surveyed land,
// model output, cover measurements or navigation geometry.
export const ZONES = [
  {
    id: 'B4',
    kind: 'weed',
    text: 'High weed presence',
    point: [0.25, 0.35],
    polygon: [
      [0.14, 0.3],
      [0.2, 0.27],
      [0.27, 0.3],
      [0.35, 0.3],
      [0.42, 0.35],
      [0.42, 0.41],
      [0.34, 0.43],
      [0.25, 0.42],
      [0.17, 0.43],
      [0.13, 0.38],
    ],
    plants: ['GP-001', 'GP-005', 'GP-006', 'GP-007'],
  },
  {
    id: 'C2',
    kind: 'weed',
    text: 'Moderate weed presence',
    point: [0.75, 0.34],
    polygon: [
      [0.69, 0.3],
      [0.75, 0.28],
      [0.8, 0.32],
      [0.85, 0.35],
      [0.84, 0.4],
      [0.77, 0.41],
      [0.69, 0.38],
    ],
    plants: ['GP-002', 'GP-003', 'GP-008', 'GP-009'],
    moderate: true,
  },
  {
    id: 'D5',
    kind: 'uncertain',
    text: 'Needs a closer look',
    point: [0.62, 0.56],
    polygon: [
      [0.52, 0.51],
      [0.61, 0.46],
      [0.68, 0.51],
      [0.73, 0.56],
      [0.7, 0.63],
      [0.63, 0.65],
      [0.55, 0.6],
      [0.49, 0.56],
    ],
    plants: ['GP-004', 'GP-010', 'GP-011', 'GP-012'],
  },
];
export const FIELD_BOUNDARY = [
  [0.065, 0.12],
  [0.915, 0.12],
  [0.998, 0.9],
  [0.005, 0.9],
];
export const UNOBSERVED = [
  [0.84, 0.53],
  [0.97, 0.53],
  [0.998, 0.9],
  [0.55, 0.9],
];

const SPECIMENS = [
  ['crop', 'B4', [0.16, 0.32, 0.048, 0.045], 'The broad leaves follow the planted vegetable row.'],
  [
    'crop',
    'C2',
    [0.71, 0.32, 0.048, 0.045],
    'This leafy seedling is aligned with the planted row.',
  ],
  [
    'crop',
    'C2',
    [0.78, 0.35, 0.048, 0.045],
    'Leaf form resembles the neighboring vegetable plants.',
  ],
  ['crop', 'D5', [0.56, 0.54, 0.048, 0.045], 'The seedling sits within a regular planting row.'],
  ['weed', 'B4', [0.21, 0.37, 0.035, 0.035], 'Small growth appears between the planted rows.'],
  [
    'weed',
    'B4',
    [0.29, 0.35, 0.035, 0.035],
    'The small leaves differ from the adjacent planted vegetables.',
  ],
  [
    'uncertain',
    'B4',
    [0.35, 0.36, 0.044, 0.042],
    'Leaf detail is unclear. Check the source before deciding.',
  ],
  [
    'weed',
    'C2',
    [0.76, 0.37, 0.035, 0.035],
    'Small broadleaf growth appears beside the planted row.',
  ],
  [
    'crop',
    'C2',
    [0.8, 0.32, 0.048, 0.045],
    'A leafy seedling follows the same spacing as nearby crops.',
  ],
  ['crop', 'D5', [0.63, 0.55, 0.048, 0.045], 'The example plant follows the established crop row.'],
  ['crop', 'D5', [0.6, 0.6, 0.048, 0.045], 'The leaf shape resembles the planted vegetables.'],
  [
    'uncertain',
    'D5',
    [0.66, 0.59, 0.035, 0.035],
    'Overlapping leaves need a closer view before deciding.',
  ],
];

export function surveyPlants() {
  return SPECIMENS.map(([label, zone, box, reasoning], i) => ({
    id: `GP-${String(i + 1).padStart(3, '0')}`,
    label,
    originalLabel: label,
    zone,
    box,
    reasoning,
    reviewed: false,
    confidence: null,
    source: 'illustrative-map',
    bestFrame: 0,
    observations: [{ time: 0, frame: 0, box }],
  }));
}

export function restoreSurvey(storage) {
  const plants = surveyPlants();
  try {
    const saved = JSON.parse(storage.getItem(REVIEW_STORAGE) || '{}');
    return plants.map((plant) => {
      const edit = saved?.[plant.id];
      return edit &&
        ['crop', 'weed', 'uncertain'].includes(edit.label) &&
        typeof edit.reviewed === 'boolean'
        ? { ...plant, label: edit.label, reviewed: edit.reviewed }
        : plant;
    });
  } catch {
    return plants;
  }
}

export function nextUnreviewed(plants, selectedId) {
  const index = plants.findIndex((plant) => plant.id === selectedId);
  for (let step = 1; step <= plants.length; step++) {
    const candidate = plants[(index + step + plants.length) % plants.length];
    if (!candidate.reviewed) return candidate.id;
  }
  return null;
}
