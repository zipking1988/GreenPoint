"""Reusable local agricultural inference; RGB only, no annotations or training.

Optional SAM candidate JSON is produced by prepare_masks.mjs. Its coordinates
must refer to this same 1024px source image. This is a research prototype.
"""
import argparse
import hashlib
import importlib.util
import json
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageDraw

import evaluate

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--image', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--sam-candidates', type=Path, nargs='*', default=[])
args = parser.parse_args()
selection = evaluate.load('selection.json')
rgb = np.array(Image.open(args.image).convert('RGB'))
if rgb.shape != (1024,1024,3):
    raise ValueError('Research adapter currently requires one orientation-normalized 1024x1024 RGB frame.')
checkpoint = root/'weights/erfnet.ckpt'
assert hashlib.sha256(checkpoint.read_bytes()).hexdigest() == '06252edf0e4d75a288d5f2d45bd386393e117454787dad93c5cdaa65e2c66fe2'
spec = importlib.util.spec_from_file_location('erfnet',root/'vendor/erfnet.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
torch.set_num_threads(4)
model=module.ERFNetModel(num_classes=3,pretrained=False)
weights=torch.load(checkpoint,map_location='cpu',weights_only=True)['state_dict']
model.load_state_dict({k.removeprefix('network.'):v for k,v in weights.items() if k.startswith('network.')},strict=True)
model.eval()
x=torch.from_numpy(rgb.copy()).permute(2,0,1).float()/255
x=(x-x.mean((1,2),keepdim=True))/(x.std((1,2),keepdim=True)+1e-17)
start=time.perf_counter()
with torch.inference_mode(): probs=model(x.unsqueeze(0)).softmax(1)[0].cpu().numpy()
elapsed=time.perf_counter()-start
labels=probs.argmax(0).astype('uint8')
image_id=args.image.name
if args.sam_candidates:
    groups=[json.loads(p.read_text()) for p in args.sam_candidates]
    if not all(g['image_id']==image_id for g in groups):
        raise ValueError('Candidate/source image identity mismatch.')
    for g in groups:
        if g.get('source_sha256') != hashlib.sha256(args.image.read_bytes()).hexdigest():
            raise ValueError('Candidate/source SHA mismatch or absent; run the source-identity-aware prepare_masks.mjs first.')
    plants=evaluate.nms([p for g in groups for p in g['plants']])
    plants=evaluate.classify(evaluate.pool_features(plants,probs.astype(np.float16)),selection['purity'])
    mode='SAM candidates + official pretrained agricultural ERFNet mask pooling'
    limited=any(g.get('limited') for g in groups)
    errors=[e for g in groups for e in g.get('errors',[])]
else:
    plants=evaluate.cc_runs({'id':image_id},labels,selection['cc_min_area'])['plants']
    mode='ERFNet semantic connected components; high recall baseline with substantial duplicate/fragment false positives'
    limited=False;errors=[]
args.output.mkdir(parents=True,exist_ok=True)
Image.fromarray(labels).save(args.output/'semantic-class-ids.png')
overlay=rgb.copy()
for cid,color in [(1,[175,195,164]),(2,[239,152,127])]:
    selected=labels==cid
    overlay[selected]=(overlay[selected]*.45+np.array(color)*.55).astype('uint8')
canvas=Image.fromarray(overlay);draw=ImageDraw.Draw(canvas)
colors={'weed':'#ef987f','crop':'#afc3a4','uncertain':'#e5be75'}
for p in plants:
    x,y,w,h=p['box'];draw.rectangle([x*1024,y*1024,(x+w)*1024,(y+h)*1024],outline=colors[p['label']],width=2)
canvas.save(args.output/'recognition.png')
result={'image_id':image_id,'source_sha256':hashlib.sha256(args.image.read_bytes()).hexdigest(),'mode':mode,
        'crop_context':'Sugar beet / PhenoBench domain only','research_prototype':True,'deployed_to_product':False,
        'plants':plants,'limited':limited,'errors':errors,'inference_seconds_cpu':elapsed,'api_calls_this_command':0,
        'trained_by_greenpoint':False,'confidence_calibrated':False,'human_review_required':True,'treatment_authorized':False,
        'source_coordinates_only':True,'annotation_input':False}
(args.output/'recognition.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'mode':mode,'plants':len(plants),'seconds':round(elapsed,3),'output':str(args.output.resolve())}))
