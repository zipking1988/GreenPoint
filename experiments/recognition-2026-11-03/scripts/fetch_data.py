"""Reconstruct exact frozen inputs with bounded ZIP ranges; never reselect images."""
import hashlib
import json
import zipfile
from pathlib import Path

from freeze_confirmatory import RemoteZip

root=Path(__file__).resolve().parents[1]
items=[i for f in ['baseline/manifest.json','confirmatory/manifest.json'] for i in json.loads((root/f).read_text())['items']]
missing=[]
for item in items:
    for kind,metadata in item['files'].items():
        path=root/metadata['path']
        if path.exists():
            assert hashlib.sha256(path.read_bytes()).hexdigest()==metadata['sha256']
        else:missing.append((item,kind,metadata))
if missing:
    remote=RemoteZip()
    with zipfile.ZipFile(remote) as archive:
        names=archive.namelist()
        for item,kind,metadata in missing:
            suffix=f'/{item["split"]}/{kind}/{item["id"]}'
            members=[n for n in names if ('/'+n).endswith(suffix)]
            assert len(members)==1
            data=archive.read(members[0])
            assert hashlib.sha256(data).hexdigest()==metadata['sha256']
            path=root/metadata['path'];path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            print('Verified',metadata['path'],flush=True)
print('All 45 frozen RGB/semantic/instance triplets verified.')
