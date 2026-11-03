"""Independent data, split, frozen-selection and all-method metric checks."""
import hashlib,json,zlib
import numpy as np
from measurement import ROOT,PREVIOUS,load,save

manifest=load('manifest.json');selection=load('selection.json')
assert hashlib.sha256((ROOT/'selection.json').read_bytes()).hexdigest()==load('selection-freeze.json')['sha256']
old={i['id']for f in ['baseline/manifest.json','confirmatory/manifest.json']for i in json.loads((PREVIOUS/f).read_text())['items']}|{'05-15_00028_P0030852.png'}
dev={i['id']for i in manifest['items']if i['purpose']=='development'};test={i['id']for i in manifest['items']if i['purpose']=='confirmation'}
assert len(dev)==20 and len(test)==40 and not dev&test and not(dev|test)&old
for item in manifest['items']:
    for meta in item['files'].values():
        data=(ROOT/meta['path']).read_bytes();assert len(data)==meta['bytes'] and zlib.crc32(data)==meta['archive_crc32'] and hashlib.sha256(data).hexdigest()==meta['sha256']
truth=load('results/confirmation/truth.json');metrics=load('results/confirmation/metrics.json');checked={}
for method,result in metrics.items():
    tp=pred=crop_errors=matched=gt_weed=gt_crop=0
    for name in test:
        run=load(f'results/confirmation/{method}/{name}.json');actual=truth[name]['plants'];plants=run['plants']
        assert run['image_id']==name
        gt_weed+=sum(p['label']=='weed'for p in actual);gt_crop+=sum(p['label']=='crop'for p in actual)
        for p in plants:
            x,y,w,h=p['box'];assert min(x,y)>=0 and min(w,h)>0 and x+w<=1.000001 and y+h<=1.000001
        if plants and actual:
            a=np.array([p['box']for p in plants]);b=np.array([p['box']for p in actual]);ar=a[:,:2]+a[:,2:];br=b[:,:2]+b[:,2:]
            overlap=np.maximum(0,np.minimum(ar[:,None,:],br[None,:,:])-np.maximum(a[:,None,:2],b[None,:,:2]));inter=overlap.prod(2);union=a[:,2:].prod(1)[:,None]+b[:,2:].prod(1)[None,:]-inter;iou=inter/union
            order=np.argsort(-iou.ravel(),kind='stable');used_p=set();used_g=set();matches={}
            for flat in order:
                pi,gi=np.unravel_index(flat,iou.shape)
                if iou[pi,gi]<.5:break
                if pi not in used_p and gi not in used_g:used_p.add(pi);used_g.add(gi);matches[pi]=gi
        else:matches={}
        matched+=len(matches)
        for pi,p in enumerate(plants):
            if p['label']=='weed':
                pred+=1
                if pi in matches:tp+=actual[matches[pi]]['label']=='weed';crop_errors+=actual[matches[pi]]['label']=='crop'
    a=result['aggregate'];assert(tp,pred,crop_errors,gt_weed,gt_crop,matched)==(a['weed_tp'],a['weed_predictions'],a['crop_as_weed'],a['gt_weed'],a['gt_crop'],a['candidate_matches']),method
    assert abs(a['weed_precision']-(tp/pred if pred else 0))<1e-12 and abs(a['weed_recall']-tp/gt_weed)<1e-12
    checked[method]={'images':40,'weed_tp':int(tp),'weed_predictions':pred,'crop_as_weed':int(crop_errors)}
assert checked['selected']['weed_tp']==119 and checked['selected']['weed_predictions']==123
assert metrics['selected']['aggregate']['target_gates_passed']
verification={'data_triplets_sha_crc_verified':60,'development_images':20,'confirmation_images':40,'previous_images_excluded':len(old),'selection_sha_unchanged':True,'independently_recomputed_all_methods':checked,'primary_gates_passed_on_point_estimates':True,'small_target_regression_disclosed':True,'new_training':False,'deployed':False,'browser_rendering_checked':False}
save('results/verification.json',verification)
print(json.dumps({'data_triplets_verified':60,'methods_independently_recomputed':len(checked),'selected':checked['selected'],'primary_gates_passed':True}))
