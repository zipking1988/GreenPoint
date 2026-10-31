export const LABELS = {
  crop: { text: 'Crop', short: 'Crop', color: '#afc3a4', action: 'Keep crop' },
  weed: { text: 'Weed', short: 'Weed', color: '#ef987f', action: 'Mark as weed' },
  uncertain: { text: 'Needs review', short: 'Uncertain', color: '#edcc79', action: 'Keep for review' },
};

export const REVIEW_STATUSES = ['pending', 'confirmed', 'deferred'];

// randomUUID requires a secure context, while getRandomValues also works for
// the HTTP LAN preview used on phones.
export function createId(source = globalThis.crypto) {
  if (typeof source?.randomUUID === 'function') return source.randomUUID();
  if (typeof source?.getRandomValues !== 'function') throw new Error('This browser cannot generate a unique session ID.');
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function reviewStatus(plant) {
  if (REVIEW_STATUSES.includes(plant.reviewStatus)) return plant.reviewStatus;
  return plant.reviewed ? (plant.label === 'uncertain' ? 'deferred' : 'confirmed') : 'pending';
}

export function restoreSampleEdit(plant, edit) {
  if (!edit || !LABELS[edit.label]) return plant;
  if (!REVIEW_STATUSES.includes(edit.reviewStatus) && typeof edit.reviewed !== 'boolean') return plant;
  const status = reviewStatus(edit);
  return { ...plant, label: edit.label, reviewStatus: status, reviewed: status === 'confirmed' };
}

export function reviewDecision(plant, label) {
  const status = label === 'uncertain' ? 'deferred' : 'confirmed';
  return { ...plant, label, reviewStatus: status, reviewed: status === 'confirmed' };
}

export function matchesPlant(plant, filter = 'all', search = '') {
  return (filter === 'all' || plant.label === filter)
    && `${plant.id} ${LABELS[plant.label].text} ${plant.reasoning}`.toLowerCase().includes(search.toLowerCase());
}

export function reviewQueue(plants, filter = 'all', search = '') {
  const rank = p => reviewStatus(p) === 'deferred' ? 2 : p.label === 'uncertain' ? 0 : 1;
  return plants.filter(p => reviewStatus(p) !== 'confirmed' && matchesPlant(p, filter, search))
    .sort((a, b) => rank(a) - rank(b));
}

export function nextReview(plants, selectedId, filter = 'all', search = '', direction = 1) {
  const queue = reviewQueue(plants, filter, search);
  if (!queue.length) return null;
  const index = queue.findIndex(p => p.id === selectedId);
  if (index === -1) return direction < 0 ? queue.at(-1) : queue[0];
  return queue[(index + (direction < 0 ? -1 : 1) + queue.length) % queue.length];
}

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
      confidence: null, reasoning, reviewed: false, reviewStatus: 'pending', source: 'illustrative',
      observations: [{ time: 0, frame: 0, box }], bestFrame: 0,
    })),
    coverage: 'Illustrative scene · not a field measurement',
    createdAt: '2026-10-31T09:00:00+09:00',
  };
}

export function summary(plants) {
  return plants.reduce((stats, plant) => {
    const status = reviewStatus(plant);
    stats[plant.label]++; stats.reviewed += Number(status === 'confirmed');
    stats.pending += Number(status === 'pending'); stats.deferred += Number(status === 'deferred');
    return stats;
  }, { crop: 0, weed: 0, uncertain: 0, reviewed: 0, pending: 0, deferred: 0 });
}

export function canExportSession(session) {
  return session.plants.length > 0 || Boolean(session.runId && ['live', 'partial'].includes(session.mode));
}

export function csvText(session) {
  const safe = value => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [['plant_id', 'label', 'original_label', 'reviewed', 'model_confidence_uncalibrated', 'source', 'best_frame', 'time_s', 'x_normalized', 'y_normalized', 'width_normalized', 'height_normalized', 'reasoning', 'session_id', 'run_id', 'session_mode', 'review_status', 'model_ids', 'elapsed_s', 'completed_frames', 'analysis_log', 'record_type']];
  const log = session.analysisLog?.length ? JSON.stringify(session.analysisLog) : '';
  session.plants.forEach(p => rows.push([p.id, p.label, p.originalLabel, reviewStatus(p) === 'confirmed', p.confidence ?? '', p.source ?? '', p.bestFrame, p.observations?.find(o => o.frame === p.bestFrame)?.time ?? 0, ...p.box, p.reasoning, session.id, session.runId ?? '', session.mode, reviewStatus(p), ['illustrative', 'illustrative-map'].includes(p.source) ? '' : (p.source ?? ''), session.elapsed ?? '', session.completedFrames ?? '', log, 'plant']));
  if (!session.plants.length && canExportSession(session)) {
    rows.push([...Array(13).fill(''), session.id, session.runId, session.mode, '', '', session.elapsed ?? '', session.completedFrames ?? '', log, 'run_summary']);
  }
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

export function frameTimecode(seconds = 0) {
  const tenths = Math.max(0, Math.round(seconds * 10));
  return `${String(Math.floor(tenths / 600)).padStart(2, '0')}:${String(Math.floor(tenths % 600 / 10)).padStart(2, '0')}.${tenths % 10}`;
}
