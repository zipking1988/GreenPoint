import sharp from 'sharp';
import { ApiError, analyze, validatePayload } from './meta-api.js';
import { plantEvidence } from './plant-evidence.js';
import { classificationBatches } from '../src/dashboard/evidence.js';

export const MAX_FRAME_PLANTS = 16;

// IDs and boxes are scoped to one image, never world coordinates or tracks.
export async function analyzeRobotFrame(input, env, fetcher = fetch, signal) {
  const checked = validatePayload({ ...input, action: 'segment' });
  const bytes = Buffer.from(checked.image.split(',')[1], 'base64');
  let normalized;
  try {
    const source = sharp(bytes, { limitInputPixels: 1_638_400, failOn: 'warning' });
    const meta = await source.metadata();
    if (meta.format !== 'jpeg' || meta.width !== checked.width || meta.height !== checked.height || (meta.orientation && meta.orientation !== 1)) throw new Error('dimensions');
    // Fully decode before billing, then preserve the verified original JPEG.
    // Re-encoding a valid low-quality frame at higher quality can exceed the
    // input byte limit without adding evidence. Crop the same source pixels.
    await source.raw().toBuffer();
    normalized = bytes;
  } catch {
    throw new ApiError(400, 'Supply a decodable, orientation-normalized JPEG whose dimensions match width and height.', 'invalid_image');
  }
  if (input.crop_reference) {
    try {
      const reference = Buffer.from(input.crop_reference.split(',')[1], 'base64');
      if (reference.length > 100_000) throw new Error('size');
      const source = sharp(reference, { limitInputPixels: 1_638_400, failOn: 'warning' });
      const meta = await source.metadata();
      if (meta.format !== 'jpeg' || (meta.orientation && meta.orientation !== 1)) throw new Error('format');
      await source.raw().toBuffer();
    } catch {
      throw new ApiError(400, 'Crop reference must be a decodable, orientation-normalized JPEG no larger than 100 KB.', 'invalid_reference');
    }
  }
  signal?.throwIfAborted();
  const image = `data:image/jpeg;base64,${normalized.toString('base64')}`;
  const segmented = await analyze(validatePayload({ ...checked, image }), env, fetcher, signal);
  const plants = segmented.detections.slice(0, MAX_FRAME_PLANTS).map((detection, index) => ({
    id: `GP-${String(index + 1).padStart(3, '0')}`, box: detection.box,
    detection_confidence: detection.detectionConfidence, label: 'uncertain', original_label: null,
    confidence: null, reviewed: false, requires_human_review: true,
    reasoning: 'Detected plant; classification is pending.',
  }));
  let failure = null;
  const usages = [segmented.usage];
  const evidence = await Promise.all(plants.map(async plant => ({ id: plant.id, ...await plantEvidence(normalized, plant.box, { context: Boolean(input.crop_reference) }) })));
  for (const batch of classificationBatches(evidence, input.crop_reference)) {
    try {
      signal?.throwIfAborted();
      const result = await analyze(validatePayload({ action: 'classify', crop: input.crop, plants: batch, referenceImage: input.crop_reference }), env, fetcher, signal);
      usages.push(result.usage);
      result.plants.forEach(result => {
        const plant = plants.find(p => p.id === result.id);
        Object.assign(plant, { label: result.label, original_label: result.originalLabel, confidence: result.confidence, reasoning: result.reasoning });
      });
    } catch (error) {
      failure = error instanceof ApiError ? error.code : signal?.aborted ? 'analysis_canceled' : 'classification_failed';
      break;
    }
  }
  return {
    schema_version: '1.1', mode: 'live', status: failure ? 'partial' : 'completed',
    ...(failure ? { error_code: failure } : {}),
    frame_id: input.frame_id, device_id: input.device_id ?? null, captured_at: input.captured_at ?? null,
    image: { width: checked.width, height: checked.height, coordinate_system: 'normalized_image_xywh', origin: 'top_left' },
    coverage: 'single_frame', identity_scope: 'this_response_only',
    limited: segmented.limited || segmented.detections.length > MAX_FRAME_PLANTS,
    candidate_count: plants.length, confidence_calibrated: false,
    requires_human_review: true, treatment_authorized: false,
    models: ['sam-3.1', 'muse-spark-1.3'], plants,
    crop_reference_used: Boolean(input.crop_reference),
    classification_strategy: input.crop_reference ? 'reference' : 'baseline',
    usage: usages.every(Boolean) ? { estimatedUsd: usages.reduce((sum, usage) => sum + usage.estimatedUsd, 0), requests: usages } : null,
  };
}
