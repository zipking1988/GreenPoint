"""Compare agricultural detectors using development labels only; never scores confirmation."""
import argparse,itertools,json
from measurement import ROOT,ev,save,truth
from optimize import prepare,runs_for
p=argparse.ArgumentParser();p.add_argument('--model',required=True,choices=['yolo','faster']);args=p.parse_args()
cache=prepare('development',args.model);reference=truth('development')
thresholds=[.1,.25,.4,.6,*[round(.7+.01*i,2)for i in range(26)],.97,.99]
grid=[]
for geometry,threshold,nms,dedup,expert,refinement in itertools.product(['whole','multiscale'],thresholds,[.5],['none','containment'],[0.,.5],['none','semantic_snap','semantic_blend']):
    config={'model':args.model,'geometry':geometry,'weed_threshold':threshold,'nms_iou':nms,'dedup':dedup,'expert_min_weed_fraction':expert,'box_refinement':refinement}
    m=ev.metrics(runs_for(cache,config),reference)['aggregate']
    grid.append({'config':config,**{k:m[k]for k in ['weed_tp','weed_predictions','gt_weed','crop_as_weed','gt_crop','weed_precision','weed_recall','weed_f1','crop_as_weed_rate','target_gates_passed']}})
preferred=[g for g in grid if g['weed_precision']>=.95 and g['weed_recall']>=.65 and g['crop_as_weed_rate']<=.05]
gated=[g for g in grid if g['target_gates_passed']]
safe=[g for g in grid if g['weed_precision']>=.9 and g['crop_as_weed_rate']<=.05]
pool=preferred or gated or safe or grid
best=sorted(pool,key=lambda g:(-(g['weed_recall'] if preferred or gated or safe else g['weed_f1']),-g['weed_precision'],g['config']['geometry']!='whole',g['config']['expert_min_weed_fraction']>0,g['config']['box_refinement']!='none',g['config']['dedup']!='none'))[0]
baseline={'model':args.model,'geometry':'whole','weed_threshold':.6 if args.model=='faster' else .25,'nms_iou':.5 if args.model=='faster' else .65,'dedup':'none','expert_min_weed_fraction':0.,'box_refinement':'none'}
methods={'official_default':baseline,'selected':best['config'],'without_dedup':{**best['config'],'dedup':'none'},'without_tiles':{**best['config'],'geometry':'whole'},'without_refinement':{**best['config'],'box_refinement':'none'},'without_expert':{**best['config'],'expert_min_weed_fraction':0.}}
metrics={}
for method,config in methods.items():
    runs=runs_for(cache,config);metrics[method]=ev.metrics(runs,reference)
    for run in runs:save(f'results/development/{args.model}/{method}/{run["image_id"]}.json',run)
save(f'calibration/{args.model}-grid.json',grid)
save(f'calibration/{args.model}-selection.json',{'selected':best,'baseline':baseline,'grid_variants':len(grid),'cohort':'20 new official val calibration only','confirmation_scores_seen':False})
save(f'results/development/{args.model}/metrics.json',metrics)
print(json.dumps({'model':args.model,'selected':best,'default':metrics['official_default']['aggregate']},indent=2))
