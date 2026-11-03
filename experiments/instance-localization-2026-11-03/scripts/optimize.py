"""Calibration-only model selection and frozen confirmation evaluation."""
import argparse,copy,datetime,hashlib,itertools,json
import numpy as np
import torch
from scipy import ndimage
from torchvision.ops import batched_nms
from measurement import ROOT,PREVIOUS,ev,items,load,save,truth

def overlap_small(a,b):
    intersection=max(0,min(a[0]+a[2],b[0]+b[2])-max(a[0],b[0]))*max(0,min(a[1]+a[3],b[1]+b[3])-max(a[1],b[1]))
    return intersection/min(a[2]*a[3],b[2]*b[3]) if intersection else 0.

def prepare(phase,model='yolo'):
    cache={}
    for item in items(phase):
        name=item['id'];folder=ROOT/f'raw/{model}/{phase}/{name}'
        whole=load(str(folder/ 'whole-0-0.json'))
        tile=[load(str(folder/f'tiles640-{x}-{y}.json')) for y in [0,384] for x in [0,384]]
        probs=np.load(ROOT/f'raw/erfnet/{phase}/{name}.npz')['probabilities'].astype(np.float32)
        components,count=ndimage.label(probs.argmax(0)==2,structure=np.ones((3,3)))
        component_boxes=[];areas=np.bincount(components.ravel())
        for cid,slices in enumerate(ndimage.find_objects(components),1):
            if slices is None or areas[cid]<4:continue
            ys,xs=slices;component_boxes.append((cid,[xs.start/1024,ys.start/1024,(xs.stop-xs.start)/1024,(ys.stop-ys.start)/1024]))
        views=[whole,*tile]
        for view in views:
            assert view['source_sha256']==item['files']['images']['sha256'] and not view['annotation_input']
            for p in view['plants']:
                x,y,w,h=p['box'];l,t=int(x*1024),int(y*1024);r,b=min(1024,int(np.ceil((x+w)*1024))),min(1024,int(np.ceil((y+h)*1024)))
                region=probs[:,t:b,l:r];foreground=region[1:].sum(0)
                eligible=foreground>=.5
                sums=region[:,eligible].sum(1) if eligible.any() else np.zeros(3)
                p['expert_weed_fraction']=float(sums[2]/(sums[1]+sums[2])) if sums[1]+sums[2] else 0.
                p['expert_foreground_pixels']=int(eligible.sum())
                if p['label']=='weed':
                    plausible=[(ev.iou(p['box'],box),cid,box) for cid,box in component_boxes if .2 <= (box[2]*box[3])/(p['box'][2]*p['box'][3]) <= 3]
                    score,cid,box=max(plausible,default=(0,None,None))
                    if score>=.15:p['semantic_component_id']=cid;p['semantic_component_box']=box
        cache[name]={'whole':whole['plants'],'multiscale':[p for v in views for p in v['plants']], 'limited':any(v['limited']for v in views)}
    return cache

def process(plants,config):
    crop_threshold=.6 if config.get('model')=='faster' else .25
    out=[p.copy() for p in plants if p['score'] >= (config['weed_threshold'] if p['label']=='weed' else crop_threshold)]
    if not out:return []
    if config.get('box_refinement','none')!='none':
        for p in out:
            if p.get('semantic_component_box'):
                original=p['box'];semantic=p['semantic_component_box']
                p['original_box']=original
                p['box']=semantic if config['box_refinement']=='semantic_snap' else [(a+b)/2 for a,b in zip(original,semantic)]
    # Prefer complete instances when a view ends inside the plant. True source-image borders are preserved.
    scores=torch.tensor([p['score']*(.8 if config['dedup']=='containment' and p['provenance']['touches_internal_tile_edge'] else 1.)for p in out])
    boxes=torch.tensor([[p['box'][0],p['box'][1],p['box'][0]+p['box'][2],p['box'][1]+p['box'][3]]for p in out])
    classes=torch.tensor([1 if p['label']=='crop' else 2 for p in out])
    if config.get('model')=='faster':classes[:]=0
    keep=batched_nms(boxes,scores,classes,config['nms_iou']).tolist()
    out=[out[i] for i in keep]
    if config['dedup']=='containment':
        discard=set()
        for i,p in enumerate(out):
            for j,q in enumerate(out):
                if i==j or p['label']!=q['label']:continue
                pa=p['box'][2]*p['box'][3];qa=q['box'][2]*q['box'][3]
                if pa<qa*.65 and overlap_small(p['box'],q['box'])>=.9 and q['score']>=p['score']*.5:
                    discard.add(i);break
        out=[p for i,p in enumerate(out)if i not in discard]
    if config['expert_min_weed_fraction']:
        for p in out:
            if p['label']=='weed' and (p['expert_weed_fraction']<config['expert_min_weed_fraction'] or p['expert_foreground_pixels']<4):p['label']='uncertain'
    return out

def runs_for(cache,config):
    return [{'image_id':name,'plants':process(group[config['geometry']],config),'limited':group['limited'] if config['geometry']=='multiscale' else False,'errors':[]}for name,group in cache.items()]

def evaluate(phase,selected=None):
    cache=prepare(phase);reference=truth(phase)
    baseline={'geometry':'whole','weed_threshold':.25,'nms_iou':.65,'dedup':'none','expert_min_weed_fraction':0.,'box_refinement':'none'}
    if selected is None:
        assert phase=='development' and not (ROOT/'selection.json').exists()
        grid=[]
        for geometry,threshold,nms,dedup,expert,refinement in itertools.product(['whole','multiscale'],[.15,.25,.4,.6,.7,.75,.8,.85,.9,.95],[.5,.65],['none','containment'],[0.,.5],['none','semantic_snap','semantic_blend']):
            config={'geometry':geometry,'weed_threshold':threshold,'nms_iou':nms,'dedup':dedup,'expert_min_weed_fraction':expert,'box_refinement':refinement}
            m=ev.metrics(runs_for(cache,config),reference)['aggregate']
            grid.append({'config':config,**{k:m[k]for k in ['weed_tp','weed_predictions','gt_weed','crop_as_weed','gt_crop','weed_precision','weed_recall','weed_f1','crop_as_weed_rate','target_gates_passed']}})
        preferred=[g for g in grid if g['weed_precision']>=.95 and g['weed_recall']>=.65 and g['crop_as_weed_rate']<=.05]
        gated=[g for g in grid if g['target_gates_passed']]
        safe=[g for g in grid if g['weed_precision']>=.9 and g['crop_as_weed_rate']<=.05]
        pool=preferred or gated or safe or grid
        selected=sorted(pool,key=lambda g:(-(g['weed_recall'] if preferred or gated or safe else g['weed_f1']),-g['weed_precision'],g['config']['geometry']!='whole',g['config']['expert_min_weed_fraction']>0,g['config']['dedup']!='none'))[0]['config']
        save('calibration-grid.json',grid)
        save('selection.json',{'selected':selected,'baseline':baseline,'selected_on':'20 new official-val calibration images only','grid_variants':len(grid),
            'rule':'Prefer precision >=95% and recall >=65%, crop-as-weed <=5%; else passing 90/60/5; else precision >=90% safety set; maximize recall, then precision, then fewer views and simpler postprocessing.',
            'frozen_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()})
        sha=hashlib.sha256((ROOT/'selection.json').read_bytes()).hexdigest();save('selection-freeze.json',{'sha256':sha,'before_confirmation_scoring':True,'before_confirmation_model_inference':True})
    methods={'official_yolov7':baseline,'selected':selected,
             'selected_without_dedup':{**selected,'dedup':'none'},
             'selected_without_tiles':{**selected,'geometry':'whole'},
             'selected_without_expert':{**selected,'expert_min_weed_fraction':0.}}
    methods['selected_without_box_refinement']={**selected,'box_refinement':'none'}
    metrics={}
    for method,config in methods.items():
        runs=runs_for(cache,config);metrics[method]=ev.metrics(runs,reference)
        for run in runs:save(f'results/{phase}/{method}/{run["image_id"]}.json',run)
    save(f'results/{phase}/metrics.json',metrics)
    print(json.dumps({'phase':phase,'selected':selected,'methods':{k:v['aggregate']for k,v in metrics.items()}},indent=2))
    return metrics

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--phase',choices=['development','confirmation','diagnostic'],required=True);p.add_argument('--select',action='store_true');args=p.parse_args()
    evaluate(args.phase,None if args.select else load('selection.json')['selected'])
