"""Score frozen new detectors and, when complete, the exact previous pipelines."""
import argparse,hashlib,json
import numpy as np
from measurement import ROOT,PREVIOUS,ev,items,load,save,truth
from optimize import prepare,runs_for
p=argparse.ArgumentParser();p.add_argument('--previous',action='store_true');args=p.parse_args()
selection=load('selection.json');assert hashlib.sha256((ROOT/'selection.json').read_bytes()).hexdigest()==load('selection-freeze.json')['sha256']
reference=truth('confirmation');metrics={}
for model in ['yolo','faster']:
    cache=prepare('confirmation',model);spec=selection['models'][model]
    configs={'official_'+model:spec['baseline'],'calibrated_'+model:spec['selected']['config']}
    if model==selection['selected']['model']:
        c=selection['selected'];configs.update(selected=c,without_dedup={**c,'dedup':'none'},without_tiles={**c,'geometry':'whole'},without_refinement={**c,'box_refinement':'none'})
        configs.update(tiles_nms_only={**c,'geometry':'multiscale','dedup':'none'},tiles_containment={**c,'geometry':'multiscale','dedup':'containment'})
    for method,config in configs.items():
        runs=runs_for(cache,config);metrics[method]=ev.metrics(runs,reference)
        for run in runs:save(f'results/confirmation/{method}/{run["image_id"]}.json',run)
if args.previous:
    complete_current=all((ROOT/f'results/confirmation/current/{i["id"]}.json').exists()for i in items('confirmation'))
    strategies={**({'current':[]}if complete_current else {}),'previous_whole':[],'previous_hybrid':[]}
    previous_selection=json.loads((PREVIOUS/'selection.json').read_text())
    assert previous_selection['geometry']=='tiles640' and previous_selection['purity']==.9
    for item in items('confirmation'):
        name=item['id']
        if complete_current:strategies['current'].append(load(f'results/confirmation/current/{name}.json'))
        whole=load(f'candidates/confirmation/whole/{name}.json');tile=load(f'candidates/confirmation/tiles640/{name}.json')
        probs=np.load(ROOT/f'raw/erfnet/confirmation/{name}.npz')['probabilities']
        for method,plants in [('previous_whole',whole['plants']),('previous_hybrid',ev.nms(whole['plants']+tile['plants']))]:
            labeled=ev.classify(ev.pool_features(plants,probs),previous_selection['purity'])
            run={'image_id':name,'plants':labeled,'limited':whole['limited']or(method=='previous_hybrid'and tile['limited']),'errors':whole['errors']+(tile['errors']if method=='previous_hybrid'else[])}
            strategies[method].append(run);save(f'results/confirmation/{method}/{name}.json',run)
    metrics={**{k:ev.metrics(v,reference)for k,v in strategies.items()},**metrics}
save('results/confirmation/metrics.json',metrics)
for method,value in metrics.items():
    a=value['aggregate'];print(method,{k:a[k]for k in ['images','weed_tp','weed_predictions','gt_weed','weed_precision','weed_recall','crop_as_weed','gt_crop','target_gates_passed','failed_images']})
