import { evidenceRegion } from './evidence.js';

const MAX_VIDEO = 150 * 1024 * 1024;
export const MAX_PREVIEW_SECONDS = 120;
export const MAX_ANALYSIS_SECONDS = 6;

// Long clips are previewed across their duration, but only short clips can be
// analyzed. The fixed interval keeps consecutive observations within the
// tracker's conservative association window.
export function sampleTimes(duration) {
  if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_PREVIEW_SECONDS) throw new Error('Choose a field clip up to two minutes long.');
  const count = Math.max(1, Math.min(12, Math.ceil(duration * 2)));
  const last = Math.max(0, duration - 0.05);
  return Array.from({ length: count }, (_, i) => duration <= MAX_ANALYSIS_SECONDS
    ? Math.min(last, i * 0.5)
    : count === 1 ? 0 : i / (count - 1) * last);
}

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

export async function readVideo(file, url, signal, onProgress, exactTimes) {
  validateVideo(file);
  const video = document.createElement('video');
  video.preload = 'auto'; video.muted = true; video.playsInline = true;
  try {
    await waitEvent(video, 'loadeddata', signal, () => { video.src = url; video.load(); });
    const times = exactTimes ?? sampleTimes(video.duration);
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(32, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(32, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    const frames = [];
    for (let i = 0; i < times.length; i++) {
      signal?.throwIfAborted();
      const time = times[i];
      if (Math.abs(video.currentTime - time) > 0.005) await waitEvent(video, 'seeked', signal, () => { video.currentTime = time; });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({ time, image: boundedJpeg(canvas, 700_000) });
      onProgress?.((i + 1) / times.length);
    }
    return { frames, width: canvas.width, height: canvas.height, duration: video.duration };
  } finally {
    video.pause(); video.removeAttribute('src'); video.load();
  }
}

export async function cropPlant(imageUrl, box) {
  return (await browserEvidence(imageUrl, box, false)).image;
}

export async function jpegSnapshot(source, width, height) {
  if (source.startsWith('data:image/jpeg;base64,')) return source;
  const image = new Image(); image.src = source;
  await image.decode();
  if (image.naturalWidth !== width || image.naturalHeight !== height) throw new Error('The source frame dimensions changed. Reload the original footage before analysis.');
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return boundedJpeg(canvas, 700_000);
}

function boundedJpeg(canvas, limit) {
  for (const quality of [0.85, 0.75, 0.65, 0.5]) {
    const encoded = canvas.toDataURL('image/jpeg', quality);
    if ((encoded.length - 23) * 0.75 <= limit) return encoded;
  }
  throw new Error('This evidence image exceeds the preview limit. Try a clearer, smaller clip.');
}

export async function browserEvidence(imageUrl, box, context = true) {
  const image = new Image(); image.src = imageUrl;
  await image.decode();
  function encode(region, size, limit, mark = false) {
    const scale = Math.min(1, size / Math.max(region.width, region.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(region.width * scale));
    canvas.height = Math.max(1, Math.round(region.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, region.left, region.top, region.width, region.height, 0, 0, canvas.width, canvas.height);
    if (mark) {
      const [x, y, w, h] = region.targetBox;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height);
    }
    return boundedJpeg(canvas, limit);
  }
  const tight = evidenceRegion(box, image.width, image.height);
  const output = { image: encode(tight, 360, 100_000) };
  if (context) {
    const expanded = evidenceRegion(box, image.width, image.height, true);
    output.contextImage = encode(expanded, 512, 200_000, true);
    output.contextBox = expanded.targetBox;
  }
  return output;
}

export async function nativeVideoData(file) {
  if (!file || !/\.mp4$/i.test(file.name) || file.size > 2_000_000) throw new Error('Native tracking needs an H.264 MP4 up to 2 MB. Choose sampled frames for other clips.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:video/mp4;base64,${btoa(binary)}`;
}
