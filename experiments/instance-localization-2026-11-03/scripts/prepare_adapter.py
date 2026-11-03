"""Extract the exact required inference definitions from pinned official YOLOv7.

No hub loading, upstream imports, eval-based model construction or unrestricted
pickle loading. Model.forward/forward_once are unchanged upstream methods.
"""
import ast,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
target=ROOT/'vendor/inference/models';target.mkdir(parents=True,exist_ok=True)
(target/'__init__.py').write_text('')
selected={
    'common.py':{'autopad','MP','SP','Concat','Conv','SPPCSPC','RepConv','ImplicitA','ImplicitM'},
    'yolo.py':{'Detect','IDetect','Model'},
}
records={}
for name,names in selected.items():
    p=ROOT/'vendor/upstream/models'/name;text=p.read_text();nodes=[]
    for node in ast.parse(text).body:
        if isinstance(node,(ast.FunctionDef,ast.ClassDef)) and node.name in names:
            if node.name=='Model':node.body=[m for m in node.body if isinstance(m,ast.FunctionDef) and m.name in ['forward','forward_once']]
            nodes.append(node)
    assert {n.name for n in nodes}==names
    header='import math\nimport numpy as np\nimport torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n'
    if name=='yolo.py':header+='from models.common import *\n'
    value='# Inference definitions from pinned official YOLOv7; see adapter-provenance.json.\n'+header+'\n'+ast.unparse(ast.Module(body=nodes,type_ignores=[]))+'\n'
    out=target/name;out.write_text(value)
    records[name]={'upstream_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'adapter_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'definitions':sorted(names),'model_methods':'only unchanged forward and forward_once; constructor/training/export paths omitted' if name=='yolo.py' else 'unchanged selected definitions'}
(ROOT/'adapter-provenance.json').write_text(json.dumps(records,indent=2)+'\n')
print('Prepared restricted inference adapter from pinned upstream source.')
