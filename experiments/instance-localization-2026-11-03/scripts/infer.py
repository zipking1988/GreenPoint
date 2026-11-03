"""Cache RGB-only real local inference. No annotations are loaded here."""
import argparse,hashlib,importlib.util,json,time
from pathlib import Path
import numpy as np
import torch
from PIL import Image
from engine import ROOT,load_model,infer_view
PREVIOUS=ROOT.parent/'recognition-2026-11-03'
parser=argparse.ArgumentParser()
parser.add_argument('--phase',choices=['development','confirmation','diagnostic'],required=True)
parser.add_argument('--model',choices=['yolo','faster','erfnet'],required=True)
parser.add_argument('--geometry',choices=['whole','multiscale'],default='multiscale')
args=parser.parse_args()
if args.phase=='diagnostic':
    items=json.loads((PREVIOUS/'confirmatory/manifest.json').read_text())['items'];base=PREVIOUS
else:
    manifest=ROOT/('development-manifest.json' if args.phase=='development' else 'manifest.json')
    items=[i for i in json.loads(manifest.read_text())['items'] if i['purpose']==args.phase];base=ROOT
if args.phase=='confirmation':
    selection=(ROOT/'selection.json').read_bytes();freeze=json.loads((ROOT/'selection-freeze.json').read_text())
    assert hashlib.sha256(selection).hexdigest()==freeze['sha256'],'Freeze calibration selection before confirmation inference.'
if args.model=='faster':
    from engine_rcnn import load_model,infer_view
    model=load_model()
elif args.model=='yolo':model=load_model()
else:
    spec=importlib.util.spec_from_file_location('erfnet',PREVIOUS/'vendor/erfnet.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    checkpoint=PREVIOUS/'weights/erfnet.ckpt';assert hashlib.sha256(checkpoint.read_bytes()).hexdigest()=='06252edf0e4d75a288d5f2d45bd386393e117454787dad93c5cdaa65e2c66fe2'
    model=module.ERFNetModel(num_classes=3,pretrained=False)
    state=torch.load(checkpoint,map_location='cpu',weights_only=True)['state_dict']
    model.load_state_dict({k.removeprefix('network.'):v for k,v in state.items() if k.startswith('network.')},strict=True);model.eval();torch.set_num_threads(4)
for item in items:
    image=base/item['files']['images']['path'];assert hashlib.sha256(image.read_bytes()).hexdigest()==item['files']['images']['sha256']
    rgb=np.array(Image.open(image).convert('RGB'));assert rgb.shape==(1024,1024,3)
    destination=ROOT/f'raw/{args.model}/{args.phase}';destination.mkdir(parents=True,exist_ok=True)
    if args.model=='erfnet':
        file=destination/(item['id']+'.npz')
        if file.exists():continue
        tensor=torch.from_numpy(rgb.copy()).permute(2,0,1).float()/255
        tensor=(tensor-tensor.mean((1,2),keepdim=True))/(tensor.std((1,2),keepdim=True)+1e-17)
        with torch.inference_mode():
            start=time.perf_counter();prob=model(tensor.unsqueeze(0)).softmax(1)[0].cpu().numpy();elapsed=time.perf_counter()-start
        np.savez_compressed(file,probabilities=prob.astype(np.float16),labels=prob.argmax(0).astype('uint8'))
        file.with_suffix('.json').write_text(json.dumps({'image_id':item['id'],'source_sha256':item['files']['images']['sha256'],'cpu_seconds':elapsed,'annotation_input':False},indent=2)+'\n')
        print(json.dumps({'phase':args.phase,'model':args.model,'image':item['id'],'seconds':round(elapsed,3)}),flush=True)
    else:
        views=[(0,0,1024,'whole')]+([(x,y,640,'tiles640') for y in [0,384] for x in [0,384]] if args.geometry=='multiscale' else [])
        for x,y,size,geometry in views:
            folder=destination/item['id'];folder.mkdir(exist_ok=True);file=folder/f'{geometry}-{x}-{y}.json'
            if file.exists():continue
            result=infer_view(model,rgb,x,y,size,geometry)
            result.update(image_id=item['id'],source_sha256=item['files']['images']['sha256'],annotation_input=False,model='official PhenoBench '+('YOLOv7' if args.model=='yolo' else 'Faster R-CNN'),trained_by_greenpoint=False,limited=len(result['plants'])>=1000)
            file.write_text(json.dumps(result,indent=2)+'\n')
            print(json.dumps({'phase':args.phase,'image':item['id'],'view':geometry,'x':x,'y':y,'candidates':len(result['plants']),'seconds':round(result['cpu_seconds'],3)}),flush=True)
