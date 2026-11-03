"""Official agricultural Faster R-CNN weights, torchvision inference-only construction."""
import hashlib,json,time
import numpy as np
import torch
from PIL import Image
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from engine import ROOT
def load_model():
    p=ROOT/'weights/fasterrcnn.pt';metadata=json.loads((ROOT/'fasterrcnn-provenance.json').read_text())
    assert hashlib.sha256(p.read_bytes()).hexdigest()==metadata['sha256']
    weights=torch.load(p,map_location='cpu',weights_only=True)['model_state_dict']
    state={k.removeprefix('network.'):v for k,v in weights.items() if k.startswith('network.')}
    model=fasterrcnn_resnet50_fpn(weights=None,weights_backbone=None,num_classes=3,box_score_thresh=.01,box_nms_thresh=.95,box_detections_per_img=1000)
    model.load_state_dict(state,strict=True);model.float().eval();torch.set_num_threads(4)
    return model
def infer_view(model,rgb,x,y,size,geometry):
    image=Image.fromarray(rgb).crop((x,y,x+size,y+size)).resize((1024,1024),Image.Resampling.BILINEAR)
    tensor=torch.from_numpy(np.array(image).copy()).permute(2,0,1).float()/255
    with torch.inference_mode():
        start=time.perf_counter();out=model([tensor])[0];elapsed=time.perf_counter()-start
    plants=[]
    for j,(box,score,cid) in enumerate(zip(out['boxes'].tolist(),out['scores'].tolist(),out['labels'].tolist())):
        l,t,r,b=box
        if cid not in [1,2] or r<=l or b<=t:continue
        plants.append({'id':f'faster-{geometry}-{x}-{y}-{j}','box':[(x+l*size/1024)/1024,(y+t*size/1024)/1024,(r-l)*size/1024/1024,(b-t)*size/1024/1024],
                       'label':'crop' if cid==1 else 'weed','score':score,'provenance':{'model':'official PhenoBench Faster R-CNN','geometry':geometry,'tile':[x,y,size],
                       'touches_internal_tile_edge':bool((x>0 and l<2)or(y>0 and t<2)or(x+size<1024 and r>1022)or(y+size<1024 and b>1022))},'human_review_required':True,'confidence_calibrated':False})
    return {'x':x,'y':y,'size':size,'plants':plants,'cpu_seconds':elapsed}
