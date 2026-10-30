export const LABELS = {
  crop: { text: 'Crop', short: 'Crop', color: '#d3fa79', action: 'Keep crop' },
  weed: { text: 'Weed', short: 'Weed', color: '#ef987f', action: 'Mark as weed' },
  uncertain: { text: 'Needs review', short: 'Review', color: '#edcc79', action: 'Keep for review' },
};

// These hand-authored records explain the review UI. They are neither model
// output nor a count of every plant in the AI-generated scene.
const specimens = [
  ['crop', [0.115, 0.258, 0.18, 0.55], 'Long, parallel leaves resemble the planted maize crop.'],
  ['crop', [0.084, 0.231, 0.072, 0.294], 'Upright leaves align with the crop row.'],
  ['crop', [0.41, 0.206, 0.134, 0.376], 'Leaf form resembles the adjacent crop seedlings.'],
  ['crop', [0.61, 0.238, 0.125, 0.333], 'A narrow-leaf seedling along the planted row.'],
  ['weed', [0.013, 0.707, 0.072, 0.216], 'Broad, lobed leaves appear between the planted rows.'],
  ['weed', [0.348, 0.534, 0.07, 0.167], 'Leaf shape differs from the nearby maize seedlings.'],
  ['uncertain', [0.418, 0.497, 0.154, 0.323], 'Broad leaves overlap nearby plants. A closer view is needed before deciding.'],
  ['weed', [0.786, 0.55, 0.161, 0.35], 'Broadleaf growth sits between the two crop rows.'],
  ['crop', [0.002, 0.164, 0.089, 0.315], 'A long-leaf seedling follows the nearest crop row.'],
  ['crop', [0.866, 0.206, 0.134, 0.307], 'The arching leaf form resembles the planted crop.'],
  ['crop', [0.741, 0.438, 0.063, 0.188], 'Narrow leaves emerge from a single crop seedling.'],
  ['uncertain', [0.596, 0.767, 0.106, 0.202], 'Small leaves are partly obscured. Inspect this plant in the field.'],
];

export function sampleSession() {
  return {
    id: 'sample-east-plot', name: 'Kashiwa / East plot', fileName: 'east-plot-illustrative.mp4',
    crop: 'Maize', mode: 'sample', duration: 8, width: 2079, height: 756,
    image: '/assets/dashboard-field.webp', video: '/assets/sample-field.mp4',
    frames: Array.from({ length: 8 }, (_, i) => ({ time: i, image: '/assets/dashboard-field.webp' })),
    plants: specimens.map(([label, box, reasoning], i) => ({
      id: `GP-${String(i + 1).padStart(3, '0')}`, label, originalLabel: label, box,
      confidence: null, reasoning, reviewed: false, source: 'illustrative',
      observations: [{ time: 0, frame: 0, box }], bestFrame: 0,
    })),
    coverage: 'Illustrative scene · not a field measurement',
    createdAt: '2026-10-31T09:00:00+09:00',
  };
}

export function summary(plants) {
  return plants.reduce((stats, plant) => { stats[plant.label]++; stats.reviewed += Number(plant.reviewed); return stats; }, { crop: 0, weed: 0, uncertain: 0, reviewed: 0 });
}

export function csvText(session) {
  const safe = value => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [['plant_id', 'label', 'original_label', 'reviewed', 'model_confidence_uncalibrated', 'source', 'best_frame', 'time_s', 'x_normalized', 'y_normalized', 'width_normalized', 'height_normalized', 'reasoning']];
  session.plants.forEach(p => rows.push([p.id, p.label, p.originalLabel, p.reviewed, p.confidence ?? '', session.mode, p.bestFrame, p.observations?.find(o => o.frame === p.bestFrame)?.time ?? 0, ...p.box, p.reasoning]));
  return '\uFEFF' + rows.map(row => row.map(safe).join(',')).join('\r\n');
}

export function downloadFile(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function timecode(seconds = 0) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
