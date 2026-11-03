"""Reuse the unchanged previous matching/metrics with this experiment's root."""
import importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PREVIOUS=ROOT.parent/'recognition-2026-11-03'
spec=importlib.util.spec_from_file_location('previous_evaluation',PREVIOUS/'scripts/evaluate.py');ev=importlib.util.module_from_spec(spec);spec.loader.exec_module(ev);ev.ROOT=ROOT
def load(p):return json.loads((ROOT/p).read_text())
def save(p,value):
    file=ROOT/p;file.parent.mkdir(parents=True,exist_ok=True);file.write_text(json.dumps(value,indent=2)+'\n')
def items(phase):
    if phase=='diagnostic':
        out=json.loads((PREVIOUS/'confirmatory/manifest.json').read_text())['items']
        return [{**i,'files':{k:{**v,'path':str(PREVIOUS/v['path'])}for k,v in i['files'].items()}}for i in out]
    return [i for i in load('manifest.json')['items'] if i['purpose']==phase]
def truth(phase):
    value=ev.make_truth(items(phase));save(f'results/{phase}/truth.json',value);return value
