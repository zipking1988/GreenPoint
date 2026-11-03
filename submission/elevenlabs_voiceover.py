#!/usr/bin/env python3
"""Prepare the storyboard, then explicitly generate an ElevenLabs narration.

Default execution is offline. Only --generate and --list-voices use the API.
The key is read from the environment or the ignored sibling .env.local file.
"""

import argparse
import base64
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import textwrap
import urllib.error
import urllib.parse
import urllib.request


ROOT = Path(__file__).resolve().parent
API = "https://api.elevenlabs.io"


def load_environment():
    values = {}
    local = ROOT / ".env.local"
    if local.exists():
        local.chmod(0o600)
        for line in local.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                name, value = line.split("=", 1)
                if name.strip() in {"ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"}:
                    values[name.strip()] = value.strip().strip('"').strip("'")
    for name in ("ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"):
        if os.environ.get(name):
            values[name] = os.environ[name].strip()
    return values


def request_json(key, path, payload=None):
    request = urllib.request.Request(
        API + path,
        data=None if payload is None else json.dumps(payload).encode("utf-8"),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "application/json"},
        method="GET" if payload is None else "POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180 if payload else 45) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        hint = {
            401: "Check the API key and its endpoint permissions.",
            403: "Check voice access, API permissions, and account restrictions.",
            429: "Check the account quota or rate limit before another explicit attempt.",
        }.get(error.code, "Check the account and request settings.")
        raise RuntimeError(f"ElevenLabs returned HTTP {error.code}. {hint} No automatic retry was made.") from None
    except (urllib.error.URLError, TimeoutError):
        raise RuntimeError("ElevenLabs connection failed. No automatic retry was made.") from None


def run(command):
    result = subprocess.run(command, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"{Path(command[0]).name} failed: {result.stderr[-1000:]}")
    return result.stdout


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)]).strip())


def time_label(seconds):
    return f"{int(seconds) // 60:02d}:{int(seconds) % 60:02d}"


def srt_time(seconds):
    millis = max(0, round(seconds * 1000))
    hours, rest = divmod(millis, 3600000)
    minutes, rest = divmod(rest, 60000)
    secs, millis = divmod(rest, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def prepare_documents(board):
    scenes = board["scenes"]
    previous_end = 0
    for scene in scenes:
        if scene["start"] != previous_end or scene["end"] <= scene["start"]:
            raise RuntimeError("Storyboard must be a continuous timeline starting at zero.")
        previous_end = scene["end"]
    if previous_end != board["duration_seconds"]:
        raise RuntimeError("Storyboard does not end at the requested duration.")

    (ROOT / "voiceover.txt").write_text("\n\n".join(s["narration"] for s in scenes) + "\n", encoding="utf-8")
    fields = [
        ("Project Description", "01-project-description.txt"),
        ("Describe your use of Meta products to build the submitted project", "02-meta-products.txt"),
        ("Why are Meta's models important to your solution?", "03-why-meta.txt"),
    ]
    copy_lines = ["# GreenPoint 英文提交文案", "", "以下三段对应官方提交表单的三个文本字段。分别复制标题下的英文正文。", ""]
    for field, filename in fields:
        copy_lines += [f"## {field}", "", (ROOT / filename).read_text(encoding="utf-8").strip(), ""]
    (ROOT / "submission-copy.md").write_text("\n".join(copy_lines), encoding="utf-8")
    lines = [
        "# GreenPoint 三分钟演示脚本", "",
        board.get("storyline_zh", "主线：真实候选 → 同源证据 → 人工决定 → 可导出记录 → Muse 调用 MCP → 完整评测。用产品操作和实际输出制造记忆点。"), "",
        "时间线为 00:00–03:00。英文旁白由 ElevenLabs 美国女声 Bella 朗读；每段留有操作停顿。画面中文说明不进入配音。", "",
        board.get("filming_note_zh", "录制使用当前线上版本。本地工作区落后于线上证据更新，先不要用旧本地页面录制。真实推理使用明确标注的录制结果；点选、人工复核与导出在实际应用中操作。"), "",
        "## 分镜与旁白", "",
    ]
    for scene in scenes:
        lines += [
            f"### {time_label(scene['start'])}–{time_label(scene['end'])} {scene['title']}", "",
            f"画面与操作：{scene['action_zh']}", "",
            f"入口：[打开画面]({scene['url']})", "",
            f"屏幕主字幕：**{scene['overlay']}**", "",
            f"来源标注：{scene['provenance']}", "",
            "英文旁白：", "", scene["narration"], "",
        ]
    if board.get("narration_method"):
        lines += ["## 本版旁白制作", "", board.get("narration_note_zh", "V2 使用此前已生成的 ElevenLabs Bella 美国女声完整句子，按原始字符时间戳重新编排。声画、字幕及旁白正文均已同步；没有新生成语音。剪接来源见 storyboard.json 的 source_audio_splices 和 audio/manifest.json。"), ""]
    lines += [
        "## 录制准备", "",
        "1. 浏览器设为 1920×1080 录制画面，100% 页面缩放；放大请在剪辑里完成，让来源框、证据和判断保留在同一镜头。",
        "2. 预载工作区、首页 Agents 段和完整评测页。开场选 Recorded · Sugar beet / Weed review example、GP-001；用未修改的录制会话开始。",
        "3. GP-001 先选 Keep for review 再 Save & next，重新选回 GP-001 展示 original model label 与 human deferred。地图切 Video 请用应用内按钮，保持同一标签页和会话。",
        "4. 导出实际 CSV，并提前准备可读的列宽。保留 original_label、label、review_status、source、run_id；录制中展示刚导出的记录。不要用编辑出来的示意 CSV 代替。",
        "5. Agents 段使用已有三步交互回放。它是另一条真实请求；不要把 agent 里 GP-001 的标签或置信度拼到工作区的记录里。",
        "6. 若演示公共 MCP 连接，录制前运行 Run MCP test，确认 3 tools discovered · 12 sample plants returned。12 条属于示例库存；真实推理证据来自独立 recorded trace。",
        "7. 正文至少保留一次完整的 3/88 杂草召回结果。不要独立宣传 3/3 为 100% 准确率；真实运动视频为零候选，不拿它证明成功追踪。",
        "8. 最后 3 秒保留产品名、URL 和 Every judgment has a frame.。字幕最多两行，移动光标先停再点，单次平移/缩放足够。", "",
        "## 演示状态与切换", "",
        "- 主演示：Recorded real Meta run。无需评委输入模型密钥；来源、模型和录制标识保持可见。",
        "- 新调用：单独的授权操作；页面打开和回放选择不会自动发起模型推理。",
        "- 插图：只作产品愿景/界面说明，保留 illustrative 标识；主镜头优先真实公开数据。",
        "- 若需重录：从原始录制会话开始；人工决定在当前标签页保留到导出。",
        "- 若发生加载或网络失败：暂停录制并重录该镜头，保持 Recorded 标识；不要把未执行成功的步骤接成成功结果。", "",
        "## 数据和声音来源", "",
        "真实图像、录制 Meta 结果和代理 trace 来自现有线上产品及 GitHub main。PhenoBench / Sugar Beets 2016 的公开数据归属见 [项目数据许可](https://greenpoint-vert.vercel.app/licenses/public-data.md)。画面角落保留数据来源；在视频说明中附该链接。", "",
        "声音使用 ElevenLabs Bella，账户 API 返回的标签为 female / american。原始语音逐段生成，保留时间戳；剪辑配音会补入操作留白，必要时进行最多 8% 的保音高语速调整。", "",
        "官方提交入口要求三分钟视频：[提交表单](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit)。", "",
    ]
    if str(board.get('revision', '')).startswith('r4'):
        begin = lines.index('## 录制准备')
        finish = lines.index('## 数据和声音来源')
        lines = lines[:begin] + [
            '## 录制与事实边界', '',
            '1. 线上段使用已有真实生产录屏，每类操作只讲一次；Meta推理结果是明确标注的recorded real run。',
            '2. 工作区GP-001与Muse MCP是两次独立推理。保留各自原始输出、置信度、运行身份，不拼接模型记录。',
            '3. 农业段读取本轮真实本地CPU推理、完整40图评测和固定消融；持续显示Local research prototype / not deployed。',
            '4. 农业检测器输出框，未生成SAM掩膜或Muse理由。不得给它拼接另一次运行的掩膜和解释。',
            '5. 同图对照精确率76.1%→96.7%、召回60.2%→60.7%、误报37→4；不以另一批39.7%召回作因果提升。',
            '6. 去重固定消融87.2%→92.5% precision、63.3% recall；最终选定整图方法不使用该去重。',
            '7. <=32px仍退步26/70→19/70；没有独立农场、日本手机场景、运动追踪或硬件验证。',
            '8. 所有研究照片和放大均保留PhenoBench / Weyler et al. / CC BY-SA 4.0归属；没有生成额外植物细节。', '',
        ] + lines[finish:]
    (ROOT / "demo-script.md").write_text("\n".join(lines), encoding="utf-8")
    words = sum(len(s["narration"].split()) for s in scenes)
    print(f"Prepared {len(scenes)} scenes, {words} spoken words, {previous_end}s timeline.")
    for scene in scenes:
        print(f"  {time_label(scene['start'])}–{time_label(scene['end'])} {scene['id']}: {len(scene['narration'].split())} words")


def verified_voice(key, voice_id):
    if not re.fullmatch(r"[A-Za-z0-9]{10,80}", voice_id):
        raise RuntimeError("Voice ID must be a valid ElevenLabs voice identifier.")
    voice = request_json(key, f"/v1/voices/{voice_id}")
    labels = voice.get("labels", {})
    female = str(labels.get("gender", "")).lower() == "female"
    american = "american" in str(labels.get("accent", "")).lower() or any(
        language.get("locale", "").lower() == "en-us" for language in voice.get("verified_languages", [])
    )
    if not (female and american):
        raise RuntimeError("Selected voice is not labeled American female. Choose a matching voice before synthesis.")
    return {"voice_id": voice_id, "name": voice.get("name"), "labels": labels}


def read_alignment(metadata):
    alignment = metadata.get("normalized_alignment") or metadata.get("alignment")
    if not alignment:
        raise RuntimeError("Provider returned no alignment; audio is retained, but subtitles cannot be verified.")
    chars = alignment["characters"]
    starts = alignment["character_start_times_seconds"]
    ends = alignment["character_end_times_seconds"]
    if not chars or len(chars) != len(starts) or len(chars) != len(ends):
        raise RuntimeError("Provider alignment has inconsistent array lengths.")
    if not all(math.isfinite(n) and n >= 0 for n in starts + ends):
        raise RuntimeError("Provider alignment contains invalid timestamps.")
    return chars, starts, ends


def captions_for_scene(metadata, offset, tempo):
    chars, starts, ends = read_alignment(metadata)
    text = "".join(chars)
    words = []
    for match in re.finditer(r"\S+", text):
        words.append((match.group(), offset + starts[match.start()] / tempo, offset + ends[match.end() - 1] / tempo))
    captions, pending = [], []
    for index, word in enumerate(words):
        pending.append(word)
        spoken = " ".join(item[0] for item in pending)
        complete_sentence = word[0].endswith((".", "?", "!", ":")) and len(spoken) >= 22
        next_long = index + 1 < len(words) and len(spoken) + 1 + len(words[index + 1][0]) > 78
        if complete_sentence or next_long or word[2] - pending[0][1] >= 4.5 or index == len(words) - 1:
            caption = "\n".join(textwrap.wrap(spoken.replace("M C P", "MCP"), width=42, break_long_words=False, break_on_hyphens=False))
            captions.append((pending[0][1], pending[-1][2], caption))
            pending = []
    return captions


def read_subtitles(path):
    def seconds(value):
        h, m, s, ms = map(int, re.split("[:,]", value))
        return h * 3600 + m * 60 + s + ms / 1000
    result = []
    for block in path.read_text().strip().split("\n\n"):
        lines = block.splitlines()
        start, end = map(seconds, lines[1].split(" --> "))
        result.append((start, end, "\n".join(lines[2:])))
    return result


def synthesize(board, environment):
    key = environment.get("ELEVENLABS_API_KEY")
    if not key:
        raise RuntimeError("Fill ELEVENLABS_API_KEY in submission/.env.local first.")
    if not all(shutil.which(binary) for binary in ("ffmpeg", "ffprobe")):
        raise RuntimeError("ffmpeg and ffprobe are required before generating audio.")
    config = board["voice"]
    voice_id = environment.get("ELEVENLABS_VOICE_ID") or config["voice_id"]
    voice = verified_voice(key, voice_id)
    print(f"Verified voice: {voice['name']} / American female.", flush=True)
    audio_root = ROOT / "audio"
    cache = audio_root / "raw"
    cache.mkdir(parents=True, exist_ok=True)
    segments, subtitles, records = [], [], []
    scenes = board["scenes"]
    for index, scene in enumerate(scenes):
        if scene.get("reuse_fitted_audio"):
            previous_board = json.loads((ROOT / scene["reuse_source_storyboard"]).read_text())
            previous_manifest = json.loads((ROOT / scene["reuse_source_manifest"]).read_text())
            previous_scene = next(s for s in previous_board["scenes"] if s["id"] == scene["id"])
            if any(previous_scene[k] != scene[k] for k in ("start", "end", "narration")):
                raise RuntimeError("Reused speech does not match the current scene text and timing.")
            if (previous_manifest["voice"]["voice_id"] != voice_id or previous_manifest["model_id"] != config["model_id"] or previous_manifest["voice_settings"] != config["settings"]):
                raise RuntimeError("Reused speech does not match the requested voice and settings.")
            selected = [(a,b,t) for a,b,t in read_subtitles(ROOT / scene["reuse_source_subtitles"]) if a >= scene["start"] - .001 and b <= scene["end"] + .001]
            normalize = lambda value: " ".join(value.replace("M C P", "MCP").split())
            if normalize(" ".join(t for _,_,t in selected)) != normalize(scene["narration"]):
                raise RuntimeError("Reused subtitles do not cover the complete passage.")
            fitted = audio_root / f"{scene['id']}.wav"
            shutil.copyfile(ROOT / scene["reuse_fitted_audio"], fitted)
            if abs(duration(fitted) - (scene["end"] - scene["start"])) > .005:
                raise RuntimeError("Reused speech has the wrong duration.")
            record = dict(next(s for s in previous_manifest["scenes"] if s["id"] == scene["id"]))
            record.update(method="reused unchanged V2 speech", reuse_fitted_from=scene["reuse_fitted_audio"])
            subtitles.extend(selected)
            segments.append(fitted)
            records.append(record)
            print(f"Reusing fitted {scene['id']}; no new API request.", flush=True)
            continue
        payload = {"text": scene["narration"], "model_id": config["model_id"], "voice_settings": config["settings"]}
        # Preserve the original synthesis context for reused passages. Editing a
        # neighboring scene does not require paying for unchanged speech again.
        previous_text = scene.get("synthesis_previous_text", scenes[index - 1]["narration"] if index else None)
        next_text = scene.get("synthesis_next_text", scenes[index + 1]["narration"] if index + 1 < len(scenes) else None)
        if previous_text:
            payload["previous_text"] = previous_text
        if next_text:
            payload["next_text"] = next_text
        request_hash = hashlib.sha256(json.dumps({"voice_id": voice_id, "payload": payload}, sort_keys=True).encode()).hexdigest()
        stem = f"{scene['id']}-{request_hash[:12]}"
        raw_audio, metadata_file = cache / f"{stem}.mp3", cache / f"{stem}.json"
        if raw_audio.exists() and metadata_file.exists():
            metadata = json.loads(metadata_file.read_text())
            if metadata.get("request_sha256") != request_hash:
                raise RuntimeError("Cached audio does not match the current request.")
            print(f"Reusing {scene['id']}; no new API request.", flush=True)
        else:
            print(f"Generating {scene['id']} ({len(scene['narration'])} characters)...", flush=True)
            response = request_json(key, f"/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128", payload)
            raw_audio.write_bytes(base64.b64decode(response["audio_base64"], validate=True))
            metadata = {"request_sha256": request_hash, "text": scene["narration"], "alignment": response.get("alignment"), "normalized_alignment": response.get("normalized_alignment")}
            metadata_file.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        raw_seconds = duration(raw_audio)
        slot = scene["end"] - scene["start"]
        available = slot - scene["lead_seconds"] - scene["tail_seconds"]
        ratio = raw_seconds / available
        if ratio > 1.08:
            available = slot - scene["lead_seconds"] - 0.5
            ratio = raw_seconds / available
            print("  Keeping a 0.5s closing beat to preserve the complete spoken passage.", flush=True)
        if ratio > 1.08:
            raise RuntimeError(f"{scene['id']} needs {raw_seconds:.2f}s in a {available:.2f}s speech slot. Shorten that scene or change its timing. Cached audio is retained.")
        tempo = max(0.92, min(1.08, ratio))
        fitted = audio_root / f"{scene['id']}.wav"
        sample_count = round(slot * 48000)
        filters = f"aformat=channel_layouts=mono,atempo={tempo:.8f},asetpts=N/SR/TB,aresample=48000,adelay={round(scene['lead_seconds'] * 1000)}:all=1,apad=whole_len={sample_count},atrim=end_sample={sample_count},asetpts=N/SR/TB"
        run(["ffmpeg", "-y", "-v", "error", "-i", str(raw_audio), "-af", filters, "-ac", "1", "-c:a", "pcm_s16le", str(fitted)])
        actual_slot = duration(fitted)
        if abs(actual_slot - slot) > 0.005:
            raise RuntimeError(f"{scene['id']} did not render to its exact scene length.")
        subtitles.extend(captions_for_scene(metadata, scene["start"] + scene["lead_seconds"], tempo))
        segments.append(fitted)
        records.append({"id": scene["id"], "start": scene["start"], "end": scene["end"], "method": "ElevenLabs synthesis with original character alignment", "speech_start": scene["start"] + scene["lead_seconds"], "speech_end": scene["start"] + scene["lead_seconds"] + raw_seconds / tempo, "closing_beat_seconds": slot - scene["lead_seconds"] - raw_seconds / tempo, "raw_seconds": raw_seconds, "tempo": tempo, "request_sha256": request_hash, "raw_audio": str(raw_audio.relative_to(ROOT)), "fitted_audio": str(fitted.relative_to(ROOT))})
        print(f"  Fitted {raw_seconds:.2f}s voice into {slot}s scene; tempo {tempo:.3f}.", flush=True)

    concat_file = audio_root / "concat.txt"
    concat_file.write_text("\n".join("file '" + str(path).replace("'", "'\\''") + "'" for path in segments) + "\n")
    wav = audio_root / "greenpoint-narration-180s.wav"
    mp3 = audio_root / "greenpoint-narration-180s.mp3"
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000", "-t", str(board["duration_seconds"]), "-ac", "1", "-c:a", "pcm_s16le", str(wav)])
    run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "192k", str(mp3)])
    run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-t", "25", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k", str(audio_root / "voice-preview.mp3")])
    master_seconds = duration(wav)
    if abs(master_seconds - board["duration_seconds"]) > 0.005:
        raise RuntimeError("Master WAV does not match the storyboard duration.")
    if any(end <= start or end > board["duration_seconds"] or end - start > 7 for start, end, _ in subtitles):
        raise RuntimeError("Subtitle timing is invalid.")
    srt = "\n\n".join(f"{index}\n{srt_time(start)} --> {srt_time(end)}\n{text}" for index, (start, end, text) in enumerate(subtitles, 1)) + "\n"
    (audio_root / "greenpoint-narration.srt").write_text(srt, encoding="utf-8")
    manifest = {"provider": "ElevenLabs", "revision": board.get("revision"), "method": board.get("narration_method", "ElevenLabs synthesis"), "voice": voice, "model_id": config["model_id"], "voice_settings": config["settings"], "master_wav_seconds": master_seconds, "subtitle_cues": len(subtitles), "scenes": records}
    (audio_root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Complete: {master_seconds:.3f}s WAV, MP3, {len(subtitles)} timed subtitle cues.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--dry-run", action="store_true", help="Validate and prepare text files offline (default).")
    modes.add_argument("--list-voices", action="store_true", help="Read American female voices using the configured key.")
    modes.add_argument("--generate", action="store_true", help="Generate missing narration clips with ElevenLabs, then assemble the 180s master.")
    args = parser.parse_args()
    board = json.loads((ROOT / "storyboard.json").read_text(encoding="utf-8"))
    prepare_documents(board)
    if args.list_voices:
        key = load_environment().get("ELEVENLABS_API_KEY")
        if not key:
            raise RuntimeError("Fill ELEVENLABS_API_KEY in submission/.env.local first.")
        query = urllib.parse.urlencode({"gender": "female", "accent": "american", "page_size": 100, "include_custom_rates": "false"})
        response = request_json(key, "/v2/voices?" + query)
        for voice in response.get("voices", []):
            print(f"{voice['voice_id']}  {voice['name']}  {voice.get('labels', {})}")
    elif args.generate:
        synthesize(board, load_environment())


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, ValueError, KeyError) as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
