#!/usr/bin/env python3
"""Edit actual production screen recordings into the 180-second submission film.

All product pixels come from the saved tab recordings. Editorial cards show the
actual exported CSV and documented architecture, separately from the app UI.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "video"
GFX = OUT / "graphics"
SHOTS = OUT / "shots"
W, H, FPS = 1920, 1080, 30
BG = "#101713"
PANEL = "#18231c"
WHITE = "#edf2e9"
SAGE = "#b4c5aa"
MUTED = "#9aa991"
LIME = "#d3fb78"
CORAL = "#ee987d"
AMBER = "#ddbd73"
MAIN = OUT / "raw/current-production-1080p.mp4"
PICK = OUT / "raw/review-pickups-1080p.mp4"


def command(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-2500:])
    return result.stdout


def static_font(source, name, weight):
    target = GFX / f"{name}-{weight}.ttf"
    if not target.exists():
        font = TTFont(source)
        font.flavor = None
        if "fvar" in font:
            font = instantiateVariableFont(font, {"wght": weight}, inplace=True)
        font.save(target)
    return target


def init_fonts():
    packages = ROOT.parent / "landing/node_modules/@fontsource-variable"
    global SORA, BODY, BODY_BOLD
    SORA = static_font(packages / "sora/files/sora-latin-wght-normal.woff2", "sora", 600)
    BODY = static_font(packages / "source-sans-3/files/source-sans-3-latin-wght-normal.woff2", "source-sans", 450)
    BODY_BOLD = static_font(packages / "source-sans-3/files/source-sans-3-latin-wght-normal.woff2", "source-sans", 600)


def font(size, bold=False, display=False):
    return ImageFont.truetype(str(SORA if display else BODY_BOLD if bold else BODY), size)


def text(draw, xy, value, size, fill=WHITE, bold=False, display=False, spacing=10):
    draw.multiline_text(xy, value, font=font(size, bold, display), fill=fill, spacing=spacing)


def brand(draw, xy=(56, 23), size=32):
    x, y = xy
    f = font(size, display=True)
    draw.text((x, y), "Green", font=f, fill=WHITE)
    draw.text((x + draw.textlength("Green", font=f), y), "Point.", font=f, fill=LIME)


def header(chapter, title, provenance):
    path = GFX / f"header-{chapter}-{hashlib.sha256((title+provenance).encode()).hexdigest()[:8]}.png"
    image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.rectangle((0, 0, W, 87), fill=BG)
    d.line((0, 87, W, 87), fill="#35432e", width=1)
    brand(d)
    text(d, (300, 26), f"{chapter}  /  {title}", 26, display=True)
    f = font(21)
    d.text((W - 52 - d.textlength(provenance, font=f), 32), provenance, font=f, fill=SAGE)
    image.save(path)
    return path


def template(kind):
    image = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(image)
    for x in range(0, W, 96):
        d.line((x, 90, x, 935), fill="#152018", width=1)
    for y in range(90, 936, 96):
        d.line((0, y, W, y), fill="#152018", width=1)
    brand(d, (72, 32), 36)
    text(d, (72, 120), "META GLOBAL AI DEVELOPER HACKATHON", 21, fill=SAGE, bold=True)
    if kind == "hook":
        text(d, (104, 240), "Before anyone acts,\nshow me the\nevidence.", 88, display=True, spacing=13)
        d.rounded_rectangle((106, 656, 948, 660), radius=2, fill=LIME)
        text(d, (108, 702), "A plant. A label.\nA decision worth checking.", 33, fill=SAGE, spacing=10)
        text(d, (108, 842), "RECORDED REAL META RUN  /  PUBLIC DATA", 21, fill=MUTED, bold=True)
    elif kind == "csv":
        text(d, (96, 154), "The judgment travels with the record.", 54, display=True)
        text(d, (98, 235), "ACTUAL CSV EXPORT  /  7 RECORDS FROM THE FILMED REVIEW", 24, fill=SAGE, bold=True)
        with (OUT / "actual-filmed-export.csv").open(encoding="utf-8-sig", newline="") as f:
            rows = list(csv.DictReader(f))
        columns = [(104, "plant_id", 220), (340, "original_label", 320), (680, "label", 300), (1000, "review_status", 380), (1390, "source", 420)]
        d.rounded_rectangle((76, 302, 1844, 858), radius=18, fill=PANEL, outline="#3b4b37", width=2)
        for x, label, _ in columns:
            text(d, (x, 327), label, 26, fill=SAGE, bold=True)
        d.line((100, 378, 1820, 378), fill="#3e4d37", width=1)
        for index, row in enumerate(rows):
            y = 400 + index * 58
            if index == 0:
                d.rounded_rectangle((93, y - 4, 1828, y + 48), radius=9, fill="#2a3722", outline=LIME, width=1)
            for x, label, _ in columns:
                value = row[label]
                color = CORAL if label == "original_label" and value == "weed" else AMBER if value in {"uncertain", "deferred"} else WHITE
                text(d, (x, y), value, 28, fill=color, bold=index == 0)
        text(d, (100, 884), "run_id: " + rows[0]["run_id"] + "    /    Full original columns retained in the CSV", 23, fill=MUTED)
    elif kind == "pipeline":
        text(d, (96, 152), "One evidence trail. Two ways in.", 61, display=True)
        text(d, (100, 265), "PLANT PERCEPTION AND REVIEW", 23, fill=SAGE, bold=True)
        labels = [("Source frame", "RGB evidence"), ("SAM 3.1", "Plant regions + masks"), ("Muse Spark", "Structured suggestions"), ("Human review", "Decision + CSV")]
        for i, (title, body) in enumerate(labels):
            x = 96 + i * 444
            d.rounded_rectangle((x, 325, x + 396, 515), radius=18, fill=PANEL, outline="#43543b", width=2)
            text(d, (x + 28, 360), title, 32, fill=LIME if i in {1, 2} else WHITE, display=True)
            text(d, (x + 28, 427), body, 25, fill=SAGE)
            if i < 3:
                d.line((x + 406, 420, x + 434, 420), fill=LIME, width=3)
                d.polygon([(x + 435, 420), (x + 425, 414), (x + 425, 426)], fill=LIME)
        text(d, (100, 598), "SOFTWARE AGENT ENTRY POINT", 23, fill=SAGE, bold=True)
        d.rounded_rectangle((96, 656, 1822, 844), radius=18, fill="#1d2a1d", outline="#43543b", width=2)
        text(d, (138, 690), "Muse agent", 37, display=True)
        text(d, (620, 690), "MCP tools", 37, fill=LIME, display=True)
        text(d, (1125, 690), "human_review", 37, display=True)
        text(d, (138, 756), "Discover capabilities", 26, fill=SAGE)
        text(d, (620, 756), "Request the perception service", 26, fill=SAGE)
        text(d, (1125, 756), "Evidence IDs + bounded next step", 26, fill=SAGE)
        for x in [500, 1020]:
            d.line((x, 714, x + 64, 714), fill=LIME, width=3)
            d.polygon([(x + 65, 714), (x + 53, 706), (x + 53, 722)], fill=LIME)
    elif kind == "roles":
        text(d, (96, 175), "From plant pixels to a reviewable decision.", 57, display=True)
        text(d, (100, 274), "FOR JAPANESE GROWERS AND FIELD-SERVICE TEAMS", 25, fill=SAGE, bold=True)
        roles = [
            ("SAM 3.1", "Find plant regions", "Regions and masks tied\nto the source image."),
            ("Muse Spark 1.3", "Interpret the crops", "Structured suggestions\nand tool-using reasoning."),
            ("Human review", "Keep the decision", "Inspect the evidence.\nPreserve a separate review."),
        ]
        for i, (name, action, detail) in enumerate(roles):
            x = 96 + 592 * i
            d.rounded_rectangle((x, 374, x + 544, 782), radius=20, fill=PANEL, outline=LIME if i < 2 else "#43543b", width=2)
            text(d, (x + 30, 409), f"0{i + 1}", 27, fill=LIME, display=True)
            text(d, (x + 30, 478), name, 36, display=True)
            text(d, (x + 30, 555), action, 32, fill=LIME, bold=True)
            text(d, (x + 30, 632), detail, 29, fill=SAGE, spacing=12)
            if i < 2:
                d.line((x + 553, 578, x + 580, 578), fill=LIME, width=3)
                d.polygon([(x + 581, 578), (x + 570, 571), (x + 570, 585)], fill=LIME)
        text(d, (100, 840), "IMPLEMENTED MODEL ROLES  /  RESEARCH PROTOTYPE", 22, fill=MUTED, bold=True)
    elif kind.startswith("trace-"):
        trace = json.loads((ROOT / "evidence/agent-trace.json").read_text())
        tools = trace["trace"]
        perception = next(t["result"] for t in tools if t["name"] == "greenpoint_analyze_frame")
        active = {"trace-discover": 0, "trace-perceive": 1, "trace-decision": 2}[kind]
        text(d, (96, 165), "An agent asks. Evidence comes back.", 59, display=True)
        text(d, (100, 262), "SELECTED FIELDS FROM THE ACTUAL RECORDED MUSE / MCP TRACE", 24, fill=SAGE, bold=True)
        cards = [
            ("DISCOVER", tools[0]["name"], [("transport", tools[0]["result"]["transport"]), ("available tools", str(len(tools[0]["result"]["tools"]))), ("coordinates", "normalized_image_xywh")]),
            ("PERCEIVE", "greenpoint_analyze_frame", [("candidate_count", str(perception["candidate_count"])), ("coverage", perception["coverage"]), ("models", "sam-3.1"), ("", "muse-spark-1.3")]),
            ("DECIDE", trace["decision"], [("evidence_ids", ", ".join(trace["evidence_ids"])), ("requires_human_review", str(trace["requires_human_review"]).lower()), ("treatment_authorized", str(trace["treatment_authorized"]).lower())]),
        ]
        for i, (label, name, fields) in enumerate(cards):
            x = 96 + i * 592
            selected = i == active
            d.rounded_rectangle((x, 346, x + 544, 812), radius=18, fill="#243223" if selected else PANEL, outline=LIME if selected else "#42533b", width=3 if selected else 1)
            text(d, (x + 28, 376), f"0{i+1}  /  {label}", 25, fill=LIME if selected else SAGE, bold=True)
            text(d, (x + 28, 443), name, 29, fill=WHITE, bold=True)
            for j, (field, value) in enumerate(fields):
                y = 516 + j * 70
                text(d, (x + 28, y), field, 21, fill=MUTED)
                text(d, (x + 28, y + 27), value, 27, fill=LIME if selected else WHITE, bold=True)
        text(d, (100, 850), "SEPARATE INFERENCE RUN  /  NO PHYSICAL HARDWARE CONNECTED", 23, fill=MUTED, bold=True)
    elif kind == "result":
        with (OUT / "actual-filmed-export.csv").open(encoding="utf-8-sig", newline="") as f:
            row = next(r for r in csv.DictReader(f) if r["plant_id"] == "GP-001")
        text(d, (96, 205), "A decision you\ncan inspect.", 79, display=True, spacing=14)
        text(d, (100, 428), "GP-001  /  ACTUAL EXPORTED RECORD", 24, fill=SAGE, bold=True)
        d.rounded_rectangle((96, 494, 1125, 870), radius=18, fill=PANEL, outline="#43543b", width=2)
        for i, field in enumerate(["original_label", "label", "review_status", "source", "run_id"]):
            y = 525 + 63 * i
            value = row[field]
            text(d, (124, y), field, 28, fill=SAGE)
            color = CORAL if field == "original_label" else AMBER if field in {"label", "review_status"} else WHITE
            text(d, (430, y), value, 27 if field in {"source", "run_id"} else 32, fill=color, bold=True)
        text(d, (100, 900), "NEXT: IMPROVE RECALL  /  EVALUATE TRACKING  /  FARMER TRIALS", 22, fill=SAGE, bold=True)
    elif kind == "next":
        text(d, (100, 238), "Next, in the field.", 74, display=True)
        for i, label in enumerate(["Improve weed recall", "Evaluate movement identity", "Run farmer trials"]):
            y = 398 + i * 124
            text(d, (108, y), f"0{i + 1}", 30, fill=LIME, display=True)
            text(d, (196, y - 1), label, 39, display=True)
        text(d, (108, 830), "AN ASSISTED-REVIEW PROTOTYPE", 22, fill=MUTED, bold=True)
    elif kind == "close":
        image = Image.new("RGBA", (W, H), (16, 23, 19, 200))
        d = ImageDraw.Draw(image)
        brand(d, (124, 282), 118)
        text(d, (134, 484), "Every judgment has a frame.", 62, display=True)
        d.rounded_rectangle((136, 605, 916, 610), radius=2, fill=LIME)
        text(d, (136, 670), "Review the evidence. Make the next judgment yours.", 33, fill=SAGE)
        text(d, (136, 784), "greenpoint-vert.vercel.app", 35, fill=LIME, bold=True)
        text(d, (136, 858), "Indie Developer  /  Build for Your World", 23, fill=SAGE)
    path = GFX / f"template-{kind}.png"
    image.save(path)
    return path


def make_shots():
    shots = []
    def add(start, end, source, at=0, take=None, crop=None, chapter="01", title="EVERY JUDGMENT HAS A FRAME", provenance="Recorded Meta result / actual product interactions", mode="normal", zoom=0.025):
        shots.append({"start": start, "end": end, "source": str(source) if source else None, "at": at, "take": take or end - start, "crop": crop or [0, 0, 1920, 1080], "chapter": chapter, "title": title, "provenance": provenance, "mode": mode, "zoom": zoom})
    add(0, 6, MAIN, 3, mode="hook", crop=[1470,260,450,790])
    add(6, 13, MAIN, 154.5, take=3.8, crop=[220,0,1500,844], chapter="02", title="SMALL FIELDS. DECISIONS TO REVIEW.", provenance="Illustrative product context / online site")
    add(13, 25, None, mode="roles", chapter="02", title="SAM + MUSE + HUMAN REVIEW", provenance="Editorial view of implemented model roles", zoom=0)
    add(25, 35, MAIN, 7, crop=[250,90,1670,940], chapter="03", title="REAL META OUTPUT. REAL REVIEW.")
    # One unbroken source shot: GP-001 is selected, zoomed and panned. Its ID
    # stays fixed while the narration explains the same-plant evidence link.
    add(35, 48, MAIN, 61.9, take=12, crop=[320,180,1600,900], chapter="03", title="GP-001 / SAME SOURCE PIXELS", zoom=0)
    add(48, 51, MAIN, 74, crop=[1320,620,600,338], chapter="03", title="INSPECT THE MODEL SUGGESTION", zoom=0.015)
    add(51, 55, PICK, 18.8, take=4, crop=[1320,550,600,338], chapter="03", title="KEEP FOR REVIEW / SAVE & NEXT", zoom=0)
    add(55, 61, PICK, 28, take=1, crop=[1300,600,620,349], chapter="03", title="GP-001 / ORIGINAL LABEL PRESERVED", zoom=0.015)
    add(61, 65, MAIN, 112.5, chapter="04", title="THE SAME DECISION, ACROSS VIEWS", zoom=0.015)
    add(65, 68, PICK, 77.8, crop=[310,180,1600,900], chapter="04", title="EXPORT THE ACTUAL REVIEW RECORD", zoom=0)
    add(68, 77, None, mode="csv", chapter="04", title="THE ACTUAL EXPORTED RECORD", provenance="Editorial view of the actual exported CSV", zoom=0)
    add(77, 83, PICK, 50, crop=[310,120,1600,900], chapter="04", title="DEFERRED CANDIDATES STAY VISIBLE")
    add(83, 89, PICK, 49, crop=[310,180,1600,900], chapter="04", title="UNCERTAINTY STAYS VISIBLE", zoom=0.015)
    add(89, 95, PICK, 50, crop=[345,350,1280,720], chapter="04", title="MODEL SUGGESTION + REVIEW STATUS", zoom=0.01)
    add(95, 102, MAIN, 161, take=1.8, crop=[220,150,1500,844], chapter="05", title="MUSE DISCOVERS THE INTERFACE", provenance="Separate recorded real agent run / software only")
    add(102, 107, MAIN, 165.5, take=2, crop=[220,150,1500,844], chapter="05", title="MCP RETURNS PLANT EVIDENCE", provenance="Separate recorded real agent run / software only")
    add(107, 110, None, mode="trace-perceive", chapter="05", title="ACTUAL RECORDED TOOL CALLS", provenance="Selected fields from the published agent trace", zoom=0)
    add(110, 118, None, mode="trace-decision", chapter="05", title="EVIDENCE IDS + HUMAN REVIEW", provenance="Selected fields from the published agent trace", zoom=0)
    add(118, 128, MAIN, 169.2, take=2, crop=[890,385,800,450], chapter="05", title="A STRUCTURED NEXT STEP", provenance="Separate recorded agent run / no hardware")
    add(128, 134, None, mode="pipeline", chapter="06", title="ONE EVIDENCE TRAIL. TWO WAYS IN.", provenance="Implemented architecture / evidence preserved", zoom=0)
    add(134, 138, MAIN, 182.2, take=2, crop=[240,0,1440,810], chapter="06", title="SOURCE. MODEL. HUMAN. PROVENANCE.")
    add(138, 145, MAIN, 177.4, take=2.1, crop=[240,0,1440,810], chapter="06", title="LINK CONSERVATIVELY", provenance="Movement identity remains unvalidated")
    add(145, 150, MAIN, 192.5, take=2, crop=[400,70,1120,630], chapter="07", title="20 IMAGES. 3 OF 88 WEEDS FOUND.", provenance="Frozen public-data check / target not met", zoom=0)
    add(150, 160, MAIN, 205, take=3, crop=[400,430,1120,630], chapter="07", title="ASSISTED REVIEW / TRACKING UNVALIDATED", provenance="Two real moving clips / zero candidates", zoom=0.01)
    add(160, 172, PICK, 28, take=1, mode="result", crop=[1470,288,450,730], chapter="08", title="A DECISION YOU CAN INSPECT", provenance="Actual exported review / original label retained", zoom=0)
    add(172, 176, PICK, 50, crop=[310,180,1600,900], chapter="08", title="THE EVIDENCE TRAVELS WITH THE RECORD", provenance="Actual product / human review required", zoom=0)
    add(176, 180, MAIN, 7, mode="close", chapter="09", title="EVERY JUDGMENT HAS A FRAME", provenance="greenpoint-vert.vercel.app", zoom=0.025)
    assert shots[0]["start"] == 0 and shots[-1]["end"] == 180
    assert all(a["end"] == b["start"] for a, b in zip(shots, shots[1:]))
    (OUT / "edit-plan.json").write_text(json.dumps(shots, ensure_ascii=False, indent=2) + "\n")
    return shots


def render_shot(index, shot):
    frames = round((shot["end"] - shot["start"]) * FPS)
    length = frames / FPS
    mode = shot["mode"]
    static_modes = {"csv", "pipeline", "roles", "trace-discover", "trace-perceive", "trace-decision"}
    overlay = template(mode) if mode in static_modes | {"hook", "next", "result", "close"} else header(shot["chapter"], shot["title"], shot["provenance"])
    fingerprint = hashlib.sha256((json.dumps(shot, sort_keys=True) + hashlib.sha256(overlay.read_bytes()).hexdigest()).encode()).hexdigest()[:12]
    target = SHOTS / f"{index:02d}-{fingerprint}.mp4"
    if target.exists():
        return index, target
    args = ["ffmpeg", "-v", "error", "-y", "-filter_complex_threads", "1"]
    if shot["source"]:
        args += ["-ss", str(shot["at"]), "-i", shot["source"]]
    else:
        args += ["-loop", "1", "-framerate", str(FPS), "-i", str(overlay)]
    args += ["-loop", "1", "-framerate", str(FPS), "-i", str(overlay)]
    x, y, cw, ch = shot["crop"]
    if y + ch > 1080:
        y = 1080 - ch
    camera = f"zoompan=z='1+{shot['zoom']}*(3*pow(on/{max(frames-1,1)},2)-2*pow(on/{max(frames-1,1)},3))':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1920x1080:fps=30"
    base = f"[0:v]trim=duration={min(shot['take'],length)},setpts=PTS-STARTPTS,crop={cw}:{ch}:{x}:{y},fps=30,tpad=stop_mode=clone:stop_duration={length},trim=duration={length}"
    if mode in static_modes:
        filters = f"[0:v]scale=1920:1080,format=yuv420p[v]"
    elif mode in {"hook", "next", "result"}:
        base += ",scale=550:900:force_original_aspect_ratio=decrease,pad=550:900:(ow-iw)/2:(oh-ih)/2:color=0x101713,setsar=1[detail]"
        filters = base + ";[1:v][detail]overlay=x=1245:y=98:shortest=1,format=yuv420p[v]"
    elif mode == "close":
        filters = base + f",scale=1920:1080,{camera},colorchannelmixer=rr=0.4:gg=0.4:bb=0.4[base];[base][1:v]overlay=0:0:shortest=1,format=yuv420p[v]"
    else:
        filters = base + f",scale=1920:1080,setsar=1,{camera}[base];[base][1:v]overlay=0:0:shortest=1,format=yuv420p[v]"
    args += ["-filter_complex", filters, "-map", "[v]", "-an", "-frames:v", str(frames), "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-threads", "4", "-pix_fmt", "yuv420p", "-video_track_timescale", "15360", str(target)]
    command(args)
    return index, target


def read_captions():
    def sec(value):
        h, m, s, ms = map(int, re.split("[:,]", value))
        return h * 3600 + m * 60 + s + ms / 1000
    captions = []
    for block in (ROOT / "audio/greenpoint-narration.srt").read_text().strip().split("\n\n"):
        lines = block.splitlines()
        start, end = map(sec, lines[1].split(" --> "))
        captions.append((start, end, "\n".join(lines[2:])))
    return captions


def render_caption_track():
    captions = read_captions()
    caption_hash = hashlib.sha256((json.dumps(captions) + "caption-style-v2").encode()).hexdigest()[:12]
    target = OUT / f"captions-{caption_hash}.mp4"
    if target.exists():
        return target
    height = 144
    def strip(value):
        image = Image.new("RGB", (W, height), BG)
        d = ImageDraw.Draw(image)
        d.line((40, 0, W - 40, 0), fill="#37442f", width=1)
        lines = value.splitlines()
        f = font(45, bold=True)
        for index, line in enumerate(lines):
            d.text(((W - d.textlength(line, font=f)) / 2, 8 + index * 49), line, font=f, fill=WHITE)
        credits = "Agricultural model evidence: PhenoBench / Weyler et al. / CC BY-SA 4.0"
        cf = font(18)
        d.text(((W - d.textlength(credits, font=cf)) / 2, 119), credits, font=cf, fill=MUTED)
        return image.tobytes()
    blank = strip("")
    rendered = {value: strip(value) for _, _, value in captions}
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"1920x{height}", "-r", "30", "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "15", "-threads", "4", "-pix_fmt", "yuv420p", str(target)], stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    cue = 0
    try:
        for frame in range(180 * FPS):
            t = frame / FPS
            while cue < len(captions) and captions[cue][1] <= t:
                cue += 1
            value = rendered[captions[cue][2]] if cue < len(captions) and captions[cue][0] <= t < captions[cue][1] else blank
            p.stdin.write(value)
        p.stdin.close()
        error = p.stderr.read().decode()
        if p.wait():
            raise RuntimeError(error)
    except Exception:
        p.kill()
        raise
    return target


def audio_mix():
    target = OUT / "soundtrack.wav"
    with wave.open(str(ROOT / "audio/greenpoint-narration-180s.wav")) as src:
        rate = src.getframerate()
        voice = np.frombuffer(src.readframes(src.getnframes()), dtype="<i2").astype(np.float32) / 32768
    n = len(voice)
    bed = np.zeros(n, dtype=np.float32)
    for start, end, notes in [(0,35,[110,164.81,220]),(35,95,[130.81,196,261.63]),(95,145,[146.83,220,293.66]),(145,180,[110,164.81,220])]:
        a, b = round(start * rate), round(end * rate)
        t = np.arange(b - a, dtype=np.float32) / rate
        envelope = np.minimum(1, t / 3) * np.minimum(1, (end - start - t) / 3)
        for frequency in notes:
            bed[a:b] += np.sin(2 * np.pi * frequency * t) * envelope * 0.0011
    rms = np.sqrt(np.mean(voice.reshape(-1,480) ** 2, axis=1))
    duck = np.repeat(np.where(rms > 0.007, 0.38, 0.75), 480)
    bed *= duck
    rng = np.random.default_rng(20261103)
    for when in [35.6,38.2,41.0,51.5,53.2,65.8,102.2,110.0]:
        a = round(when * rate)
        t = np.arange(round(0.075 * rate), dtype=np.float32) / rate
        click = (np.sin(2*np.pi*740*t)*0.006 + rng.normal(0,0.003,len(t))) * np.exp(-t*80)
        bed[a:a+len(t)] += click
    mixed = np.clip(voice + bed, -0.98, 0.98)
    with wave.open(str(target), "wb") as dst:
        dst.setnchannels(1); dst.setsampwidth(2); dst.setframerate(rate)
        dst.writeframes((mixed * 32767).astype("<i2").tobytes())
    return target


def main():
    for directory in [OUT, GFX, SHOTS]:
        directory.mkdir(exist_ok=True)
    init_fonts()
    shots = make_shots()
    print(f"Rendering {len(shots)} editorial shots from two actual production recordings.", flush=True)
    results = {}
    with ThreadPoolExecutor(max_workers=3) as pool:
        pending = {pool.submit(render_shot,index,shot):index for index,shot in enumerate(shots)}
        for future in as_completed(pending):
            index,path = future.result()
            results[index] = path
            print(f"Rendered {index+1:02d}/{len(shots)}: {shots[index]['start']:03d}–{shots[index]['end']:03d}s", flush=True)
    concat = OUT / "shots.ffconcat"
    concat.write_text("\n".join("file '" + str(results[i]) + "'" for i in range(len(shots))) + "\n")
    silent = OUT / "picture-master.mp4"
    command(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",str(concat),"-an","-c:v","copy","-movflags","+faststart",str(silent)])
    captions = render_caption_track()
    soundtrack = audio_mix()
    final = OUT / "GreenPoint-Hackathon-Demo-3min-final.mp4"
    srt = OUT / "GreenPoint-Hackathon-Demo-en.srt"
    shutil.copyfile(ROOT / "audio/greenpoint-narration.srt", srt)
    shutil.copyfile(srt, OUT / "GreenPoint-Hackathon-Demo-final-en.srt")
    print("Compositing burned-in English subtitles and the Bella narration.", flush=True)
    command(["ffmpeg","-v","error","-y","-filter_complex_threads","2","-i",str(silent),"-i",str(captions),"-i",str(soundtrack),"-filter_complex","[0:v][1:v]overlay=0:936:shortest=1,format=yuv420p[v]","-map","[v]","-map","2:a:0","-c:v","libx264","-preset","fast","-crf","18","-threads","8","-c:a","aac","-b:a","192k","-metadata","title=GreenPoint | Every judgment has a frame","-metadata:s:a:0","language=eng","-r","30","-t","180","-movflags","+faststart",str(final)])
    shutil.copyfile(final, OUT / "GreenPoint-Hackathon-Demo-3min.mp4")
    command(["ffmpeg", "-v", "error", "-y", "-ss", "2", "-i", str(final), "-frames:v", "1", "-q:v", "2", str(OUT / "GreenPoint-Hackathon-Demo-poster.jpg")])
    info = json.loads(command(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(final)]))
    narration = json.loads((ROOT / "audio/manifest.json").read_text())
    (OUT / "render-manifest.json").write_text(json.dumps({"revision":"final Bella pickups","source":"Actual current-production tab screen recordings", "source_recordings":[str(MAIN),str(PICK)],"editorial_cards":["implemented model roles","actual CSV export","selected actual agent-trace fields","implemented architecture","actual exported review result"],"duration_seconds":180,"voice":"ElevenLabs Bella / American English female","narration_method":narration.get("method"),"burned_in_subtitle_cues":len(read_captions()),"subtitle_delivery":"Burned-in captions and separate SRT; no duplicate embedded track","theme":"Build for Your World","original_background":"Quiet synthesized pad and UI ticks; no third-party music", "probe":info},indent=2)+"\n")
    print(f"Video complete: {final} ({final.stat().st_size/1_000_000:.1f} MB)", flush=True)


if __name__ == "__main__":
    current = json.loads((ROOT / 'storyboard.json').read_text())
    if str(current.get('revision', '')).startswith('r4'):
        from render_recognition_video import main as recognition_main
        recognition_main()
    else:
        main()
