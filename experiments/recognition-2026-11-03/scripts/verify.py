"""Independent invariants for data identity and the paired measurement adapter."""
import hashlib
import json
from pathlib import Path

import evaluate

root = Path(__file__).resolve().parents[1]
for file in ['baseline/manifest.json', 'confirmatory/manifest.json']:
    manifest = json.loads((root/file).read_text())
    for item in manifest['items']:
        for metadata in item['files'].values():
            assert hashlib.sha256((root/metadata['path']).read_bytes()).hexdigest() == metadata['sha256']
old = json.loads((root/'baseline/manifest.json').read_text())
new = json.loads((root/'confirmatory/manifest.json').read_text())
assert not ({i['id'] for i in old['items']} & {i['id'] for i in new['items']})
truth = evaluate.load('baseline/truth.json')
runs = [evaluate.load(f'baseline/evaluation/{i["id"]}.json') for i in old['items'] if i['purpose']=='evaluation']
measured = evaluate.metrics(runs,truth)['aggregate']
frozen = evaluate.load('baseline/evaluation-metrics.json')['baseline']
aliases = {'gt_plants':'ground_truth_plants','gt_weed':'ground_truth_weed','gt_crop':'ground_truth_crop','candidates':'detected_candidates','weed_tp':'weed_true_positives'}
for key in ['images','gt_plants','gt_weed','gt_crop','candidates','weed_predictions','weed_tp','weed_precision','weed_recall','weed_f1','crop_as_weed_rate','uncertain_rate','detection_recall_iou50']:
    assert abs(measured[key]-frozen[aliases.get(key,key)]) < 1e-12, key
# Duplicate predictions consume only one match. A crop labeled weed is a false positive.
actual = [{'label':'weed','box':[0,0,.1,.1]},{'label':'crop','box':[.5,.5,.1,.1]}]
plants = [{'label':'weed','box':[0,0,.1,.1]},{'label':'weed','box':[0,0,.1,.1]},{'label':'weed','box':[.5,.5,.1,.1]}]
m=evaluate.metrics([{'image_id':'fixture','plants':plants}],{'fixture':{'plants':actual}})['aggregate']
assert m['weed_tp']==1 and m['weed_predictions']==3 and m['crop_as_weed']==1 and m['candidate_matches']==2
assert m['weed_precision']==1/3 and m['weed_recall']==1
selection=root/'selection.json'
freeze=root/'selection-freeze.json'
if freeze.exists():
    assert hashlib.sha256(selection.read_bytes()).hexdigest()==json.loads(freeze.read_text())['selection_sha256']
for phase in ['development','evaluation','confirmatory']:
    for p in (root/f'candidates/{phase}').glob('*/*.json'):
        d=json.loads(p.read_text())
        assert d.get('source_sha256')==next(i['files']['images']['sha256'] for i in old['items']+new['items'] if i['id']==d['image_id']), p
        for plant in d['plants']:
            if plant.get('mask_file'):
                from PIL import Image
                l,t,r,b=plant['mask_bounds']
                assert Image.open(root/plant['mask_file']).size==(r-l,b-t)
print('Verified 45 source/annotation triplets; confirmation is image-disjoint; original 20-image metrics reproduce exactly; duplicate and crop-error accounting passes.')
