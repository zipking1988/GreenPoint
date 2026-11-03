"""Finite evidence allowlist; no model, keys, environment, raw caches or video."""
import hashlib,json,re,zipfile
from measurement import ROOT,load
files=[ROOT/p for p in ['REPORT.md','REPRODUCE.md','VIDEO-HANDOFF.md','requirements-lock.txt','evidence-gallery.html','protocol.json','manifest.json','data-selection.json','selection.json','selection-freeze.json',
 'frozen-ablation-definitions.json','calibration-history.json','weights-provenance.json','fasterrcnn-provenance.json','adapter-provenance.json',
 'baseline-classifier-stop.json','calibration/yolo-selection.json','calibration/faster-selection.json','calibration/yolo-grid.json','calibration/faster-grid.json',
 'cases/index.json','results/comparison.csv','results/bootstrap.json','results/verification.json','results/budget-snapshot.json','results/confirmation/metrics.json',
 'results/confirmation/selected-errors.json','results/confirmation/previous_hybrid-errors.json']]
files+=sorted((ROOT/'cases').glob('*.png'))
hashes={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()for p in files}
(ROOT/'evidence-sha256.json').write_text(json.dumps(hashes,indent=2)+'\n');files.append(ROOT/'evidence-sha256.json')
target=ROOT/'GreenPoint-instance-localization-evidence.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED)as z:
 for p in files:
    value=p.read_bytes()
    if p.suffix!='.png':assert not re.search(rb'(?:sk_|sk-proj-)[A-Za-z0-9_-]{20,}',value),'Credential-like text must not enter evidence bundle'
    z.writestr(str(p.relative_to(ROOT)),value)
with zipfile.ZipFile(target)as z:
 assert z.testzip()is None
 assert all(not any(x in n.lower()for x in ['.env','weights/','.venv/','raw/','node_modules/','.mp4'])for n in z.namelist())
print(json.dumps({'bundle':str(target),'bytes':target.stat().st_size,'files':len(files),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}))
