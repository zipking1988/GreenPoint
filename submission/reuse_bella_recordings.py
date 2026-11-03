#!/usr/bin/env python3
"""Re-edit the existing Bella recordings offline, preserving provider alignment.

Only complete sentences from the original timestamped ElevenLabs recordings are
used. This script never reads a credential and never sends a network request.
"""

import hashlib
import json
from pathlib import Path
import wave

import elevenlabs_voiceover as speech


ROOT = Path(__file__).resolve().parent
RATE = 48000


def concat_wavs(paths, output):
    with wave.open(str(output), "wb") as dst:
        dst.setnchannels(1)
        dst.setsampwidth(2)
        dst.setframerate(RATE)
        for path in paths:
            with wave.open(str(path), "rb") as src:
                assert (src.getnchannels(), src.getsampwidth(), src.getframerate()) == (1, 2, RATE)
                dst.writeframes(src.readframes(src.getnframes()))


def wav_seconds(path):
    with wave.open(str(path), "rb") as src:
        return src.getnframes() / src.getframerate()


def main():
    board = json.loads((ROOT / "storyboard.json").read_text())
    speech.prepare_documents(board)
    original = json.loads((ROOT / "video/versions/v1/audio/manifest.json").read_text())
    assert original["voice"]["voice_id"] == board["voice"]["voice_id"]
    assert original["voice"]["labels"]["gender"] == "female"
    assert original["voice"]["labels"]["accent"] == "american"
    audio = ROOT / "audio"
    edits = audio / "edits-v2"
    edits.mkdir(exist_ok=True)
    gap = edits / "sentence-gap.wav"
    with wave.open(str(gap), "wb") as dst:
        dst.setnchannels(1)
        dst.setsampwidth(2)
        dst.setframerate(RATE)
        dst.writeframes(b"\0\0" * round(.18 * RATE))
    records, subtitles, fitted_paths = [], [], []
    for scene in board["scenes"]:
        parts, alignments, source_records = [], [], []
        offset = 0
        splices = scene["source_audio_splices"]
        assert scene["narration"] == " ".join(p["text"] for p in splices)
        for index, splice in enumerate(splices):
            metadata_file = ROOT / splice["metadata"]
            metadata = json.loads(metadata_file.read_text())
            chars, starts, ends = speech.read_alignment(metadata)
            b, e = splice["character_start"], splice["character_end"]
            assert "".join(chars[b:e]).strip() == splice["text"]
            raw = metadata_file.with_suffix(".mp3")
            cut_start = max(0, starts[b] - .035)
            cut_end = min(speech.duration(raw), ends[e - 1] + .10)
            clip = edits / f"{scene['id']}-{index}.wav"
            speech.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"atrim=start={cut_start:.6f}:end={cut_end:.6f},asetpts=PTS-STARTPTS,aformat=channel_layouts=mono,aresample={RATE},afade=t=in:d=0.004,afade=t=out:st={cut_end-cut_start-.006:.6f}:d=0.006", "-c:a", "pcm_s16le", str(clip)])
            if index:
                parts.append(gap)
                offset += .18
            selected = {"normalized_alignment": {
                "characters": chars[b:e],
                "character_start_times_seconds": [v - cut_start for v in starts[b:e]],
                "character_end_times_seconds": [v - cut_start for v in ends[b:e]],
            }}
            alignments.append((offset, selected))
            parts.append(clip)
            offset += wav_seconds(clip)
            source_records.append({"file": str(raw.relative_to(ROOT)), "source_request_sha256": metadata["request_sha256"], "cut_start": cut_start, "cut_end": cut_end, "text": splice["text"]})
        raw_scene = edits / f"{scene['id']}-assembled.wav"
        concat_wavs(parts, raw_scene)
        raw_seconds = wav_seconds(raw_scene)
        slot = scene["end"] - scene["start"]
        available = slot - scene["lead_seconds"] - scene["tail_seconds"]
        tempo = max(.92, raw_seconds / available)
        if tempo > 1.08:
            raise RuntimeError(f"{scene['id']} does not fit naturally: {raw_seconds:.3f}s in {available:.3f}s")
        samples = round(slot * RATE)
        fitted = audio / f"{scene['id']}.wav"
        filters = f"atempo={tempo:.9f},asetpts=N/SR/TB,aresample={RATE},adelay={round(scene['lead_seconds']*1000)}:all=1,apad=whole_len={samples},atrim=end_sample={samples},asetpts=N/SR/TB"
        speech.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw_scene), "-af", filters, "-ac", "1", "-c:a", "pcm_s16le", str(fitted)])
        assert abs(wav_seconds(fitted) - slot) < 1 / RATE
        for part_offset, alignment in alignments:
            subtitles.extend(speech.captions_for_scene(alignment, scene["start"] + scene["lead_seconds"] + part_offset / tempo, tempo))
        fitted_paths.append(fitted)
        speech_end = scene["start"] + scene["lead_seconds"] + raw_seconds / tempo
        records.append({"id": scene["id"], "start": scene["start"], "end": scene["end"], "speech_start": scene["start"] + scene["lead_seconds"], "speech_end": speech_end, "closing_beat_seconds": scene["end"] - speech_end, "tempo": tempo, "raw_seconds": raw_seconds, "source_recording_splices": source_records, "fitted_audio": str(fitted.relative_to(ROOT))})
        print(f"{scene['id']}: {raw_seconds:.2f}s original Bella / {slot}s scene / tempo {tempo:.3f}", flush=True)
    unnormalized = edits / "narration-concat.wav"
    concat_wavs(fitted_paths, unnormalized)
    wav = audio / "greenpoint-narration-180s.wav"
    speech.run(["ffmpeg", "-v", "error", "-y", "-i", str(unnormalized), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000", "-t", "180", "-ac", "1", "-c:a", "pcm_s16le", str(wav)])
    assert wav_seconds(wav) == 180
    speech.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "192k", str(audio / "greenpoint-narration-180s.mp3")])
    assert all(a[1] <= b[0] for a, b in zip(subtitles, subtitles[1:]))
    assert all(0 <= start < end <= 180 and len(value.splitlines()) <= 2 for start, end, value in subtitles)
    srt = "\n\n".join(f"{i}\n{speech.srt_time(start)} --> {speech.srt_time(end)}\n{value}" for i, (start, end, value) in enumerate(subtitles, 1)) + "\n"
    (audio / "greenpoint-narration.srt").write_text(srt)
    manifest = {"provider": "ElevenLabs", "revision": "v2", "method": "Offline sentence edits of existing timestamped Bella recordings; no new API synthesis", "voice": original["voice"], "model_id": original["model_id"], "voice_settings": original["voice_settings"], "master_wav_seconds": wav_seconds(wav), "subtitle_cues": len(subtitles), "sha256": hashlib.sha256(wav.read_bytes()).hexdigest(), "scenes": records}
    (audio / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Complete: 180.000s / {len(subtitles)} aligned cues / existing Bella voice.", flush=True)


if __name__ == "__main__":
    main()
