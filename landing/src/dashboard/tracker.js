const center = box => [box[0] + box[2] / 2, box[1] + box[3] / 2];
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// A conservative geometric baseline, not validated tracking ground truth.
// Never link across sparse samples or a likely cut. Ambiguous assignments
// become new candidates rather than silently merging separate plants.
export function linkDetections(tracks, detections, frame, time) {
  const used = new Set();
  let nextId = tracks.reduce((n, t) => Math.max(n, Number(t.id.slice(3))), 0) + 1;
  const previous = tracks.filter(t => t.observations.at(-1).frame === frame - 1 && time - t.observations.at(-1).time <= 0.8);
  const candidates = detections.map(d => {
    const ranked = previous.map(t => {
      const last = t.observations.at(-1);
      const ratio = (d.box[2] * d.box[3]) / (last.box[2] * last.box[3]);
      const delta = distance(center(d.box), center(last.box));
      return { track: t, score: ratio > 0.6 && ratio < 1.65 && delta < Math.min(0.055, Math.max(d.box[2], d.box[3]) * 0.4) ? delta : Infinity };
    }).sort((a, b) => a.score - b.score);
    return { detection: d, best: ranked[0], ambiguous: ranked[1] && ranked[1].score - ranked[0].score < 0.02 };
  });
  for (const candidate of candidates) {
    const { detection, best, ambiguous } = candidate;
    const competing = candidates.some(other => other !== candidate && other.best?.track === best?.track && other.best?.score <= best?.score + 0.02);
    const match = best && Number.isFinite(best.score) && !ambiguous && !competing && !used.has(best.track.id) ? best.track : null;
    const observation = { frame, time, box: detection.box, mask: detection.mask };
    if (match) {
      used.add(match.id); match.observations.push(observation);
      if (detection.box[2] * detection.box[3] > match.box[2] * match.box[3]) { match.box = detection.box; match.bestFrame = frame; match.mask = detection.mask; }
    } else {
      tracks.push({ id: `GP-${String(nextId++).padStart(3, '0')}`, label: 'uncertain', originalLabel: null, confidence: null, box: detection.box, mask: detection.mask, observations: [observation], bestFrame: frame, reviewed: false, source: 'sam-3.1', reasoning: 'Detected by SAM. Classification is pending human review.' });
    }
  }
  return tracks;
}
