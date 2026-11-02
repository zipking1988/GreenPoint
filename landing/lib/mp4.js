// Bounded ISO BMFF metadata inspection. No shell, remote URL or media decoder.
export function inspectMp4(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length > 2_000_000 || bytes.length < 32) throw new Error('Use an MP4 no larger than 2 MB for native tracking.');
  const boxes = (start, end) => {
    const result = [];
    for (let at = start; at < end;) {
      if (at + 8 > end) throw new Error('Incomplete MP4 container.');
      let size = bytes.readUInt32BE(at), header = 8;
      if (size === 1) { if (at + 16 > end) throw new Error('Incomplete MP4 box.'); size = Number(bytes.readBigUInt64BE(at + 8)); header = 16; }
      if (size === 0) size = end - at;
      if (!Number.isSafeInteger(size) || size < header || at + size > end) throw new Error('Invalid MP4 box length.');
      result.push({ type: bytes.toString('ascii', at + 4, at + 8), start: at + header, end: at + size });
      at += size;
    }
    return result;
  };
  const children = box => boxes(box.start, box.end);
  const one = (list, type) => { const matches = list.filter(b => b.type === type); if (matches.length !== 1) throw new Error(`Expected one MP4 ${type} box.`); return matches[0]; };
  const at = (box, offset, length = 4) => { if (box.start + offset + length > box.end) throw new Error('Truncated MP4 metadata.'); return box.start + offset; };
  const u32 = (box, offset) => bytes.readUInt32BE(at(box, offset));
  const duration = box => {
    const version = bytes[at(box, 0, 1)];
    if (version !== 0 && version !== 1) throw new Error('Unsupported MP4 metadata version.');
    const scale = u32(box, version ? 20 : 12);
    const ticks = version ? Number(bytes.readBigUInt64BE(at(box, 24, 8))) : u32(box, 16);
    if (!scale || !Number.isSafeInteger(ticks)) throw new Error('Invalid MP4 timeline.');
    return { seconds: ticks / scale, scale };
  };
  const top = boxes(0, bytes.length);
  if (!top.some(b => b.type === 'ftyp') || !top.some(b => b.type === 'mdat')) throw new Error('Use a complete H.264 MP4.');
  const moov = children(one(top, 'moov'));
  const movieDuration = duration(one(moov, 'mvhd')).seconds;
  const tracks = moov.filter(b => b.type === 'trak').flatMap(trak => {
    const parts = children(trak), mdia = children(one(parts, 'mdia'));
    const handler = one(mdia, 'hdlr');
    if (bytes.toString('ascii', at(handler, 8), at(handler, 8) + 4) !== 'vide') return [];
    const tkhd = one(parts, 'tkhd'), version = bytes[at(tkhd, 0, 1)];
    if (![0, 1].includes(version)) throw new Error('Unsupported track header.');
    const matrix = version ? 52 : 40;
    const expected = [65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824];
    if (expected.some((value, i) => u32(tkhd, matrix + i * 4) !== value)) throw new Error('Native tracking needs orientation-normalized MP4. Use sampled frames for this clip.');
    const width = u32(tkhd, version ? 88 : 76) / 65536, height = u32(tkhd, version ? 92 : 80) / 65536;
    const timeline = duration(one(mdia, 'mdhd'));
    const stbl = children(one(children(one(mdia, 'minf')), 'stbl'));
    const stsd = one(stbl, 'stsd');
    if (u32(stsd, 4) !== 1 || !['avc1', 'avc3'].includes(bytes.toString('ascii', at(stsd, 12), at(stsd, 12) + 4))) throw new Error('Native tracking supports H.264 MP4. Use sampled frames for other codecs.');
    if (bytes.readUInt16BE(at(stsd, 40, 2)) !== width || bytes.readUInt16BE(at(stsd, 42, 2)) !== height) throw new Error('Native tracking needs matching stored and displayed frame dimensions. Use sampled frames for scaled media.');
    const stts = one(stbl, 'stts');
    if (u32(stts, 4) !== 1) throw new Error('Use a constant-frame-rate MP4, or choose sampled frames.');
    const frameCount = u32(stts, 8), delta = u32(stts, 12), fps = timeline.scale / delta;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 32 || height < 32 || width > 1280 || height > 1280 || !(fps > 0 && fps <= 30.01) || !frameCount || frameCount > 181 || !(timeline.seconds > 0 && timeline.seconds <= 6.05) || Math.abs(frameCount / fps - timeline.seconds) > 0.06) throw new Error('Native tracking needs a clip up to 6 seconds, 30 fps and 1280 pixels per axis.');
    return [{ width, height, fps, frameCount, duration: timeline.seconds }];
  });
  if (tracks.length !== 1 || !(movieDuration > 0 && movieDuration <= 6.05)) throw new Error('Use one video track with a total duration up to 6 seconds.');
  return tracks[0];
}
