#!/usr/bin/env python3
"""Package the checked final film and its editable source assets, excluding keys."""

import hashlib
import json
from pathlib import Path
import shutil
import zipfile


ROOT = Path(__file__).resolve().parent


def main():
    qa = json.loads((ROOT / "video/qa-report.json").read_text())
    movie = ROOT / "video" / qa["file"]
    if qa.get("full_decode") != "passed" or hashlib.sha256(movie.read_bytes()).hexdigest() != qa["sha256"]:
        raise RuntimeError("The final video must pass verification after its last render.")
    if str(qa.get('revision', '')).startswith('r4') and qa.get('visual_review') != 'passed':
        raise RuntimeError('The current r4 render still needs its final visual sample review.')
    board = json.loads((ROOT / "storyboard.json").read_text())
    paths = [
        "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "PUBLICATION.md", "submission-copy.md", "01-project-description.txt",
        "02-meta-products.txt", "03-why-meta.txt", "demo-script.md",
        "storyboard.json", "voiceover.txt", "fact-check.md", ".env.example",
        ".gitignore", "elevenlabs_voiceover.py", "render_demo_video.py",
        "package_submission.py", "render_recognition_video.py", "prepare_recognition_revision.py", "verify_recognition_video.py", "evidence/actual-review-export.csv",
        "evidence/agent-trace.json", "audio/greenpoint-narration-180s.wav",
        "audio/greenpoint-narration-180s.mp3", "audio/greenpoint-narration.srt",
        "audio/voice-preview.mp3", "audio/manifest.json", "video/README.md",
        "video/" + qa["file"], "video/GreenPoint-Hackathon-Demo-final-en.srt",
        "video/GreenPoint-Hackathon-Demo-poster.jpg", "video/upload-description.txt",
        "video/actual-filmed-export.csv", "video/edit-plan.json",
        "video/render-manifest.json", "video/qa-report.json",
        "video/capture-log.json", "video/pickup-capture-log.json",
        "video/raw/current-production-1080p.mp4",
        "video/raw/review-pickups-1080p.mp4",
    ]
    for scene in board["scenes"]:
        paths.append("audio/" + scene["id"] + ".wav")
        for field in ("reuse_fitted_audio", "reuse_source_storyboard", "reuse_source_manifest", "reuse_source_subtitles"):
            if scene.get(field):
                paths.append(scene[field])
    if str(board.get('revision', '')).startswith('r4'):
        audio_manifest = json.loads((ROOT / 'audio/manifest.json').read_text())
        for record in audio_manifest['scenes']:
            raw = Path(record['raw_audio'])
            paths += [str(raw), str(raw.with_suffix('.json'))]
    else:
        paths += [str(p.relative_to(ROOT)) for p in sorted((ROOT / "audio/raw").glob("*")) if p.suffix in {".mp3", ".json"}]
    paths += [str(p.relative_to(ROOT)) for p in sorted((ROOT / "video/graphics").glob("*.ttf"))]
    paths += [str(p.relative_to(ROOT)) for p in sorted((ROOT / "video/graphics/licenses").glob("*.txt"))]
    paths += [str(p.relative_to(ROOT)) for p in sorted((ROOT / "video/graphics-r4").glob("*.ttf"))]
    paths += [str(p.relative_to(ROOT)) for p in sorted((ROOT / "evidence/agricultural").rglob("*")) if p.is_file()]
    paths = list(dict.fromkeys(paths))
    target = ROOT / "GreenPoint-submission-kit-final.zip"
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for relative in paths:
            source = ROOT / relative
            if not source.resolve().is_relative_to(ROOT) or source.name == ".env.local":
                raise RuntimeError("Package source is outside the allowed artifact paths.")
            archive.write(source, "GreenPoint-submission/" + relative)
    # Compare locally without displaying or retaining any credential value.
    secrets = []
    local = ROOT / ".env.local"
    if local.exists():
        for line in local.read_text().splitlines():
            if line.startswith("ELEVENLABS_API_KEY="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
                if value:
                    secrets.append(value.encode())
    with zipfile.ZipFile(target) as archive:
        if archive.testzip() is not None:
            raise RuntimeError("Package ZIP integrity failed.")
        for name in archive.namelist():
            if name.endswith(".env.local") or any(value in archive.read(name) for value in secrets):
                raise RuntimeError("Credential exclusion check failed.")
    shutil.copy2(target, ROOT / "GreenPoint-submission-kit.zip")
    print(json.dumps({"kit": str(target), "files": len(paths), "kit_mb": round(target.stat().st_size / 1e6, 1), "zip_integrity": "passed", "credential_exclusion": "passed", "movie_sha256": qa["sha256"]}, indent=2))


if __name__ == "__main__":
    main()
