"""Freeze public RGB/reference files before model calls; fetch selected ZIP members only."""
import hashlib
import io
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '../reviews/hackathon-sprint-2026-11-03')
ZIP_URL = 'https://www.phenobench.org/data/PhenoBench-v110.zip'
VIDEO_BASE = 'https://raw.githubusercontent.com/supervisely-ecosystem/sugarbeet-multiview-sample-video-project-annotated/0763cbbd251701c97f0c5fc7eee999af1a929afd/'
VIDEO_NAME = '2016-05-05-12-59-07_16_rgb.mp4'
EXCLUDED = '05-15_00028_P0030852.png'


class RemoteZip(io.RawIOBase):
    def __init__(self, url):
        self.url, self.pos, self.transferred = url, 0, 0
        with urllib.request.urlopen(urllib.request.Request(url, method='HEAD'), timeout=60) as response:
            self.size = int(response.headers['Content-Length'])

    def seekable(self): return True
    def readable(self): return True
    def tell(self): return self.pos

    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else self.size + offset
        if self.pos < 0: raise ValueError('Negative seek')
        return self.pos

    def read(self, count=-1):
        count = min(self.size - self.pos, count if count >= 0 else self.size - self.pos)
        if count <= 0: return b''
        if count > 8_000_000 or self.transferred + count > 200_000_000:
            raise RuntimeError('Selected-member download budget exceeded; do not fetch the full archive.')
        request = urllib.request.Request(self.url, headers={'Range': f'bytes={self.pos}-{self.pos + count - 1}'})
        with urllib.request.urlopen(request, timeout=90) as response:
            if response.status != 206: raise RuntimeError('Server did not honor HTTP Range.')
            value = response.read(count)
        self.pos += len(value)
        self.transferred += len(value)
        return value


def digest(data): return hashlib.sha256(data).hexdigest()


def download(url, destination, limit):
    if destination.exists(): return destination.read_bytes()
    with urllib.request.urlopen(url, timeout=90) as response:
        data = response.read(limit + 1)
    if len(data) > limit: raise RuntimeError('Public fixture exceeds its size limit.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    return data


ROOT.mkdir(parents=True, exist_ok=True)
manifest_path = ROOT / 'manifest.json'
if manifest_path.exists():
    raise SystemExit('Frozen manifest already exists. Do not silently reselect the evaluation set.')
manifest = {'version': 1, 'seed': '20261103', 'frozen_before_inference': True, 'selection': 'SHA256(seed:basename), 5 train development / 20 validation evaluation; previous smoke frame excluded', 'sources': {'phenobench': ZIP_URL, 'video_repository_commit': '0763cbbd251701c97f0c5fc7eee999af1a929afd'}, 'items': []}
remote = RemoteZip(ZIP_URL)
with zipfile.ZipFile(remote) as archive:
    members = set(archive.namelist())
    for split, count, purpose in [('train', 5, 'development'), ('val', 20, 'evaluation')]:
        images = [name for name in members if f'/{split}/images/' in '/' + name and name.endswith('.png') and Path(name).name != EXCLUDED]
        images.sort(key=lambda name: digest(('20261103:' + Path(name).name).encode()))
        if len(images) < count: raise RuntimeError(f'Cannot identify the official {split} split.')
        for name in images[:count]:
            entry = {'id': Path(name).name, 'split': split, 'purpose': purpose, 'files': {}}
            for field in ['images', 'semantics', 'plant_instances']:
                source = name.replace('/images/', f'/{field}/')
                if source not in members: raise RuntimeError(f'Missing official annotation: {source}')
                destination = ROOT / 'data' / split / field / Path(name).name
                destination.parent.mkdir(parents=True, exist_ok=True)
                data = destination.read_bytes() if destination.exists() else archive.read(source)
                if not destination.exists(): destination.write_bytes(data)
                entry['files'][field] = {'path': str(destination.relative_to(ROOT)), 'sha256': digest(data), 'bytes': len(data)}
            manifest['items'].append(entry)
            print(f'Frozen {purpose}: {entry["id"]}', flush=True)
for field, suffix, limit in [('video', f'project/ds0/video/{VIDEO_NAME}', 14_000_000), ('annotation', f'project/ds0/ann/{VIDEO_NAME}.json', 2_000_000), ('classes', 'project/meta.json', 10_000)]:
    destination = ROOT / 'video' / (VIDEO_NAME if field == 'video' else 'annotations.json' if field == 'annotation' else 'classes.json')
    data = download(VIDEO_BASE + suffix, destination, limit)
    manifest.setdefault('video', {})[field] = {'path': str(destination.relative_to(ROOT)), 'sha256': digest(data), 'bytes': len(data)}
manifest['video']['annotation_scope'] = 'Per-frame semantic masks; object keys are not reused across frames. Not tracking ground truth.'
manifest['video']['development_seconds'] = [0, 4]
manifest['video']['evaluation_seconds'] = [6, 10]
manifest['range_bytes_transferred'] = remote.transferred
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Frozen {len(manifest["items"])} images and RGB video. Range bytes: {remote.transferred}', flush=True)
