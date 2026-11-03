"""Finite display-only allowlist; no keys, weights, environment, or video assets."""
import hashlib
import json
import re
import zipfile
from pathlib import Path

root=Path(__file__).resolve().parents[1]
files=[root/n for n in ['REPORT.md','REPRODUCE.md','evidence-gallery.html','protocol.json','selection.json','selection-freeze.json','cases/index.json','results/verification.json',
        'results/comparison.csv','results/paired-bootstrap.json','results/runtime.json','results/budget-snapshot.json',
        'results/evaluation/metrics.json','results/evaluation/error-analysis.json','results/confirmatory/metrics.json','results/confirmatory/error-analysis.json',
        'baseline/manifest.json','confirmatory/manifest.json']]
files+=sorted((root/'cases').glob('confirmatory-*.png'))
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
(root/'evidence-sha256.json').write_text(json.dumps(manifest,indent=2)+'\n')
files.append(root/'evidence-sha256.json')
destination=root/'GreenPoint-recognition-evidence.zip'
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
    for p in files:
        value=p.read_bytes()
        if p.suffix not in ['.png']:
            assert not re.search(rb'(?:sk_|sk-proj-)[A-Za-z0-9_-]{20,}',value), 'Credential-like text must not enter the display bundle.'
        archive.writestr(str(p.relative_to(root)),value)
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    assert all(not any(x in n.lower() for x in ['.env','weights/','.venv/','node_modules/','.mp4']) for n in archive.namelist())
print(json.dumps({'bundle':str(destination),'bytes':destination.stat().st_size,'files':len(files),'sha256':hashlib.sha256(destination.read_bytes()).hexdigest()}))
