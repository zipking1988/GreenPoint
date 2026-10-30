const MAX_VIDEO = 150 * 1024 * 1024;

export function validateVideo(file) {
  if (!file || !/\.(mp4|mov|webm|m4v)$/i.test(file.name)) throw new Error('Choose an MP4, MOV, M4V or WebM video.');
  if (file.size > MAX_VIDEO) throw new Error('Choose a video smaller than 150 MB. Trim a short field walk and try again.');
  if (!file.size) throw new Error('This file is empty. Choose another video.');
}

function waitEvent(video, event, signal, action) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error('This video could not be decoded. Try an H.264 MP4.')), 15_000);
    const cleanup = () => { clearTimeout(timeout); video.removeEventListener(event, ready); video.removeEventListener('error', failed); signal?.removeEventListener('abort', aborted); };
    const finish = error => { cleanup(); error ? reject(error) : resolve(); };
    const ready = () => finish();
    const failed = () => finish(new Error('Your browser cannot read this video. Export it as H.264 MP4 and try again.'));
    const aborted = () => finish(new DOMException('Canceled', 'AbortError'));
    video.addEventListener(event, ready, { once: true });
    video.addEventListener('error', failed, { once: true });
    signal?.addEventListener('abort', aborted, { once: true });
    if (signal?.aborted) return aborted();
    action?.();
  });
}

export async function readVideo(file, url, signal, onProgress) {
  validateVideo(file);
  const video = document.createElement('video');
  video.preload = 'auto'; video.muted = true; video.playsInline = true;
  try {
    await waitEvent(video, 'loadeddata', signal, () => { video.src = url; video.load(); });
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 120) throw new Error('Choose a field clip up to two minutes long.');
    const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(32, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(32, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    const count = Math.max(1, Math.min(12, Math.ceil(video.duration * 2)));
    const frames = [];
    for (let i = 0; i < count; i++) {
      signal?.throwIfAborted();
      const time = count === 1 ? 0 : Math.min(video.duration - 0.05, i / (count - 1) * (video.duration - 0.05));
      if (Math.abs(video.currentTime - time) > 0.005) await waitEvent(video, 'seeked', signal, () => { video.currentTime = time; });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({ time, image: canvas.toDataURL('image/jpeg', 0.78) });
      onProgress?.((i + 1) / count);
    }
    return { frames, width: canvas.width, height: canvas.height, duration: video.duration };
  } finally {
    video.pause(); video.removeAttribute('src'); video.load();
  }
}

export async function cropPlant(imageUrl, box) {
  const image = new Image(); image.src = imageUrl;
  await image.decode();
  const [x, y, w, h] = box;
  const padding = 0.15;
  const left = Math.max(0, x - w * padding);
  const top = Math.max(0, y - h * padding);
  const width = Math.min(1 - left, w * (1 + 2 * padding));
  const height = Math.min(1 - top, h * (1 + 2 * padding));
  const scale = Math.min(1, 360 / Math.max(width * image.width, height * image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * image.width * scale));
  canvas.height = Math.max(1, Math.round(height * image.height * scale));
  canvas.getContext('2d').drawImage(image, left * image.width, top * image.height, width * image.width, height * image.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}
