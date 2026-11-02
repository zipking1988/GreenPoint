// All regions use the same source pixels. Shared by the browser and Node.
export function evidenceRegion(box, imageWidth, imageHeight, context = false) {
  const [x, y, w, h] = box;
  const factor = context ? 3 : 1.3;
  const width = Math.min(imageWidth, Math.max(context ? 192 : 1, Math.ceil(w * imageWidth * factor)));
  const height = Math.min(imageHeight, Math.max(context ? 192 : 1, Math.ceil(h * imageHeight * factor)));
  const left = Math.max(0, Math.min(imageWidth - width, Math.floor((x + w / 2) * imageWidth - width / 2)));
  const top = Math.max(0, Math.min(imageHeight - height, Math.floor((y + h / 2) * imageHeight - height / 2)));
  return { left, top, width, height, targetBox: [(x * imageWidth - left) / width, (y * imageHeight - top) / height, w * imageWidth / width, h * imageHeight / height].map(v => Math.max(0, Math.min(1, v))) };
}

export function observedPlants(session, frameIndex) {
  return (session?.plants ?? []).flatMap(plant => {
    const observation = plant.observations?.find(item => item.frame === frameIndex);
    return observation ? [{ ...plant, box: observation.box, mask: observation.mask ?? null, sourceFrame: frameIndex }] : [];
  });
}

export function classificationBatches(plants, referenceImage) {
  const result = [];
  let batch = [];
  for (const plant of plants) {
    const candidate = [...batch, plant];
    if (candidate.length > 4 || JSON.stringify({ plants: candidate, referenceImage }).length > 2_500_000) {
      if (!batch.length) throw new Error('Plant evidence exceeds the request limit. Use a smaller snapshot.');
      result.push(batch); batch = [plant];
    } else batch = candidate;
    if (JSON.stringify({ plants: batch, referenceImage }).length > 2_500_000) throw new Error('Plant evidence exceeds the request limit.');
  }
  if (batch.length) result.push(batch);
  return result;
}
