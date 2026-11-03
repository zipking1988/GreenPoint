"""Freeze the winner across calibrated models before any candidate-model confirmation inference."""
import datetime,hashlib,json
from measurement import ROOT,load,save
for model in ['yolo','faster']:
    assert not (ROOT/f'raw/{model}/confirmation').exists(),'Confirmation inference already began; do not retune.'
rows=[load(f'calibration/{model}-selection.json')['selected']for model in ['yolo','faster']]
preferred=[g for g in rows if g['weed_precision']>=.95 and g['weed_recall']>=.65 and g['crop_as_weed_rate']<=.05]
gated=[g for g in rows if g['target_gates_passed']]
safe=[g for g in rows if g['weed_precision']>=.9 and g['crop_as_weed_rate']<=.05]
pool=preferred or gated or safe or rows
winner=sorted(pool,key=lambda g:(-(g['weed_recall']if preferred or gated or safe else g['weed_f1']),-g['weed_precision'],g['config']['geometry']!='whole'))[0]
for old,new in [('selection.json','calibration-stage2-selection.json'),('selection-freeze.json','calibration-stage2-freeze.json')]:
    if (ROOT/old).exists():(ROOT/old).rename(ROOT/new)
selection={'selected':winner['config'],'calibration_metrics':{k:v for k,v in winner.items() if k!='config'},'models':{m:load(f'calibration/{m}-selection.json')for m in ['yolo','faster']},
 'frozen_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'confirmation_candidate_predictions_seen':False,'confirmation_scores_seen':False,
 'rule':'Prefer calibration precision>=.95 and recall>=.65, crop-as-weed<=.05; else 90/60/5 pass; else precision>=.90 safety; maximize recall, then precision; if none safe maximize F1.',
 'notes':'Earlier failed calibration stages preserved. No confirmation labels informed any selection. Existing previous-model baseline recordings may run before this candidate freeze.'}
save('selection.json',selection)
save('selection-freeze.json',{'sha256':hashlib.sha256((ROOT/'selection.json').read_bytes()).hexdigest(),'before_candidate_confirmation_inference':True,'before_confirmation_scoring':True})
print(json.dumps(selection,indent=2))
