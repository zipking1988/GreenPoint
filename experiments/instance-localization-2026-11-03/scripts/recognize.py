"""Run the frozen agricultural detector on a new RGB frame; no ground truth or API."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from measurement import ROOT,load
from optimize import process
parser=argparse.ArgumentParser();parser.add_argument('--image',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
selection=load('selection.json')['selected']
assert selection['box_refinement']=='none' and not selection['expert_min_weed_fraction'],'This CLI must be extended before using a semantic-refinement selection.'
if selection['model']=='yolo':from engine import load_model,infer_view
else:from engine_rcnn import load_model,infer_view
rgb=np.array(Image.open(args.image).convert('RGB'));assert rgb.shape==(1024,1024,3),'Current research adapter requires orientation-normalized 1024px RGB.'
model=load_model();views=[infer_view(model,rgb,0,0,1024,'whole')]
if selection['geometry']=='multiscale':views += [infer_view(model,rgb,x,y,640,'tiles640')for y in [0,384]for x in [0,384]]
plants=process([p for v in views for p in v['plants']],selection)
args.output.mkdir(parents=True,exist_ok=True)
result={'image_id':args.image.name,'source_sha256':hashlib.sha256(args.image.read_bytes()).hexdigest(),'plants':plants,'selection':selection,'trained_by_greenpoint':False,
        'annotation_input':False,'api_calls':0,'cpu_inference_seconds':sum(v['cpu_seconds']for v in views),'human_review_required':True,'treatment_authorized':False,'coordinates':'source image only','research_prototype':True,'deployed':False,'crop_context':'sugar beet / PhenoBench domain'}
(args.output/'recognition.json').write_text(json.dumps(result,indent=2)+'\n')
out=Image.fromarray(rgb);draw=ImageDraw.Draw(out)
for p in plants:
    x,y,w,h=p['box'];draw.rectangle([x*1024,y*1024,(x+w)*1024,(y+h)*1024],outline={'weed':'#ef987f','crop':'#afc3a4','uncertain':'#e5be75'}[p['label']],width=2)
out.save(args.output/'recognition.png')
print(json.dumps({'output':str(args.output.resolve()),'plants':len(plants),'cpu_seconds':result['cpu_inference_seconds'],'api_calls':0}))
