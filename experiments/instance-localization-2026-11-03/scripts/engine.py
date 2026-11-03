"""Real pretrained YOLOv7 RGB inference, restricted checkpoint loading."""
import argparse,hashlib,importlib,json,sys,time
from pathlib import Path
import numpy as np
import torch
from PIL import Image
from torchvision.ops import batched_nms
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'vendor/inference'))

def load_model():
    meta=json.loads((ROOT/'weights-provenance.json').read_text())
    checkpoint=ROOT/'weights/yolov7_plant_detection.pt'
    assert hashlib.sha256(checkpoint.read_bytes()).hexdigest()==meta['sha256']
    common=importlib.import_module('models.common');yolo=importlib.import_module('models.yolo')
    allowed={f'{module.__name__}.{name}':getattr(module,name) for module,names in [(common,['MP','SP','Concat','Conv','SPPCSPC','RepConv','ImplicitA','ImplicitM']),(yolo,['Model','Detect','IDetect'])] for name in names}
    allowed.update({'builtins.set':set,'argparse.Namespace':argparse.Namespace})
    allowed.update({'numpy.core.multiarray._reconstruct':np._core.multiarray._reconstruct,'numpy.dtype':np.dtype,'numpy.ndarray':np.ndarray})
    globals_=torch.serialization.get_unsafe_globals_in_checkpoint(checkpoint)
    for name in globals_:
        if name.startswith('torch.nn.modules.'):
            module,attribute=name.rsplit('.',1);value=getattr(importlib.import_module(module),attribute)
            assert isinstance(value,type) and issubclass(value,torch.nn.Module)
            allowed[name]=value
    unknown=set(globals_)-set(allowed)
    assert not unknown,f'Unreviewed checkpoint globals: {sorted(unknown)}'
    dtype_classes=[type(np.dtype(name)) for name in ['float16','float32','float64','int32','int64']]
    with torch.serialization.safe_globals([(allowed[name],name) for name in globals_]+dtype_classes):
        obj=torch.load(checkpoint,map_location='cpu',weights_only=True)
    model=obj.get('ema') or obj['model']
    model=model.float().eval()
    assert list(model.names)==['soil','crop','weed'] or list(model.names.values())==['soil','crop','weed']
    torch.set_num_threads(4)
    for module in model.modules():
        if hasattr(module,'_non_persistent_buffers_set'):module._non_persistent_buffers_set=set()
    return model

def infer_view(model,rgb,x,y,size,geometry):
    image=Image.fromarray(rgb).crop((x,y,x+size,y+size)).resize((1024,1024),Image.Resampling.BILINEAR)
    tensor=torch.from_numpy(np.array(image).copy()).permute(2,0,1).float().unsqueeze(0)/255
    with torch.inference_mode():
        start=time.perf_counter();prediction=model(tensor)[0][0];elapsed=time.perf_counter()-start
    # Preserve a low-confidence candidate cache. Postprocessing thresholds are selected only on calibration data.
    prediction=prediction[prediction[:,4]>.01]
    scores,classes=(prediction[:,5:]*prediction[:,4:5]).max(1)
    valid=(scores>.01)&(classes>0)
    prediction,scores,classes=prediction[valid],scores[valid],classes[valid]
    boxes=torch.empty_like(prediction[:,:4]);boxes[:,:2]=prediction[:,:2]-prediction[:,2:4]/2;boxes[:,2:4]=prediction[:,:2]+prediction[:,2:4]/2
    keep=batched_nms(boxes,scores,classes,.95)[:1000]
    plants=[]
    for j in keep.tolist():
        l,t,r,b=boxes[j].tolist();l=max(0,min(1024,l));r=max(0,min(1024,r));t=max(0,min(1024,t));b=max(0,min(1024,b))
        if r<=l or b<=t:continue
        label='crop' if int(classes[j])==1 else 'weed'
        plants.append({'id':f'{geometry}-{x}-{y}-{j}','box':[(x+l*size/1024)/1024,(y+t*size/1024)/1024,(r-l)*size/1024/1024,(b-t)*size/1024/1024],
                       'label':label,'score':float(scores[j]),'provenance':{'model':'official PhenoBench YOLOv7','geometry':geometry,'tile':[x,y,size],'local_box':[l/1024,t/1024,(r-l)/1024,(b-t)/1024],
                       'touches_internal_tile_edge':bool((x>0 and l<2)or(y>0 and t<2)or(x+size<1024 and r>1022)or(y+size<1024 and b>1022))},'human_review_required':True,'confidence_calibrated':False})
    return {'x':x,'y':y,'size':size,'plants':plants,'cpu_seconds':elapsed}
