"""Paired object evaluation; parameter selection is restricted to development."""
import argparse
import hashlib
import itertools
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]

def load(path): return json.loads((ROOT / path).read_text())
def save(path, value):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, indent=2) + '\n')

def items_for(phase):
    manifest = load('confirmatory/manifest.json' if phase == 'confirmatory' else 'baseline/manifest.json')
    return [i for i in manifest['items'] if i['purpose'] == phase]

def make_truth(items):
    truth = {}
    for item in items:
        semantics = np.asarray(Image.open(ROOT / item['files']['semantics']['path']))
        instances = np.asarray(Image.open(ROOT / item['files']['plant_instances']['path']))
        plants = []
        for identity in np.unique(instances):
            if not identity: continue
            selected = instances == identity
            counts = np.bincount(semantics[selected].astype(int), minlength=5)
            label = int(np.argmax(counts[1:]) + 1)
            if label not in [1, 2, 3, 4]: continue
            ys, xs = np.where(selected)
            plants.append({'id': int(identity), 'label': 'crop' if label in [1, 3] else 'weed', 'partial': label in [3, 4], 'pixels': int(selected.sum()),
                           'box': [float(xs.min()/1024), float(ys.min()/1024), float((xs.max()-xs.min()+1)/1024), float((ys.max()-ys.min()+1)/1024)]})
        truth[item['id']] = {'width': 1024, 'height': 1024, 'plants': plants}
    return truth

def iou(a, b):
    area = max(0, min(a[0]+a[2], b[0]+b[2])-max(a[0], b[0])) * max(0, min(a[1]+a[3], b[1]+b[3])-max(a[1], b[1]))
    return area / (a[2]*a[3]+b[2]*b[3]-area) if area else 0.

def match(plants, actual):
    # Stable prediction/GT order reproduces the existing JS comparator at equal IoU.
    pairs = [(pi, gi, iou(p['box'], g['box'])) for pi, p in enumerate(plants) for gi, g in enumerate(actual)]
    pairs = sorted((p for p in pairs if p[2] >= .5), key=lambda p: -p[2])
    pred, gt, matches = set(), set(), {}
    for pi, gi, score in pairs:
        if pi not in pred and gi not in gt:
            pred.add(pi); gt.add(gi); matches[pi] = gi
    return matches

def size_bin(g):
    size = max(g['box'][2:])*1024
    return '<=32' if size <= 32 else '33-64' if size <= 64 else '65-128' if size <= 128 else '>128'

def metrics(runs, truth):
    per_image = []
    for run in runs:
        plants, actual = run['plants'], truth[run['image_id']]['plants']
        matches = match(plants, actual)
        gt = {gi: pi for pi, gi in matches.items()}
        counts = {'images': 1, 'gt_plants': len(actual), 'gt_weed': sum(g['label']=='weed' for g in actual), 'gt_crop': sum(g['label']=='crop' for g in actual),
                  'candidates': len(plants), 'candidate_matches': len(matches), 'weed_candidate_matches': sum(actual[g]['label']=='weed' for g in matches.values()),
                  'weed_predictions': sum(p.get('label')=='weed' for p in plants), 'weed_tp': sum(p.get('label')=='weed' and pi in matches and actual[matches[pi]]['label']=='weed' for pi,p in enumerate(plants)),
                  'crop_as_weed': sum(p.get('label')=='weed' and pi in matches and actual[matches[pi]]['label']=='crop' for pi,p in enumerate(plants)),
                  'uncertain': sum(p.get('label')=='uncertain' for p in plants), 'limited_images': int(bool(run.get('limited'))), 'failed_images': int(bool(run.get('errors')))}
        for bucket in ['<=32', '33-64', '65-128', '>128']:
            eligible = [gi for gi,g in enumerate(actual) if g['label']=='weed' and size_bin(g)==bucket]
            counts['gt_weed_'+bucket] = len(eligible)
            counts['matched_weed_'+bucket] = sum(gi in gt for gi in eligible)
            counts['tp_weed_'+bucket] = sum(gi in gt and plants[gt[gi]].get('label')=='weed' for gi in eligible)
        per_image.append({'image_id': run['image_id'], **{k:int(v) for k,v in counts.items()}})
    totals = {key: sum(i[key] for i in per_image) for key in per_image[0] if key != 'image_id'}
    def ratio(a,b): return totals[a]/totals[b] if totals[b] else 0.
    totals.update(weed_precision=ratio('weed_tp','weed_predictions'), weed_recall=ratio('weed_tp','gt_weed'),
                  weed_candidate_recall=ratio('weed_candidate_matches','gt_weed'), detection_recall_iou50=ratio('candidate_matches','gt_plants'),
                  crop_as_weed_rate=ratio('crop_as_weed','gt_crop'), uncertain_rate=ratio('uncertain','candidates'))
    p,r = totals['weed_precision'],totals['weed_recall']
    totals['weed_f1'] = 2*p*r/(p+r) if p+r else 0.
    totals['target_gates_passed'] = p >= .9 and r >= .6 and totals['crop_as_weed_rate'] <= .05
    totals['small_target_bins'] = {b: {'gt_weed': totals['gt_weed_'+b], 'candidate_matches':totals['matched_weed_'+b], 'weed_tp':totals['tp_weed_'+b]} for b in ['<=32','33-64','65-128','>128']}
    return {'aggregate': totals, 'per_image': per_image}

def nms(plants):
    # Same class-agnostic IoU threshold for every geometry. No GT-informed suppression.
    ordered = sorted(enumerate(plants), key=lambda z: (-(z[1].get('detectionConfidence') or 0), z[0]))
    kept = []
    for _, p in ordered:
        if not any(iou(p['box'],q['box']) >= .5 for q in kept): kept.append(p)
    return kept

def pool_features(plants, probs):
    features = []
    for p in plants:
        if p.get('mask_file'):
            mask = np.asarray(Image.open(ROOT / p['mask_file'])) > 0
            if mask.ndim == 3: mask = mask[:,:,0]
            l,t,r,b = p['mask_bounds']
            selected = probs[:,t:b,l:r][:,mask]
            method = 'official_sam_mask'
        else:
            x,y,w,h = p['box']; l,t = int(x*1024),int(y*1024);r,b = min(1024,int(np.ceil((x+w)*1024))),min(1024,int(np.ceil((y+h)*1024)))
            selected = probs[:,t:b,l:r].reshape(3,-1)
            method = 'bbox_fallback'
        means = selected.astype(np.float32).mean(axis=1) if selected.shape[1] else np.zeros(3)
        vegetation = float(means[1]+means[2])
        purity = float(max(means[1:])/vegetation) if vegetation else 0.
        label = 'crop' if means[1] >= means[2] else 'weed'
        features.append({**p, 'erfnet_means': [float(z) for z in means], 'vegetation_probability': vegetation, 'class_purity': purity, 'proposed_label': label, 'pooling': method})
    return features

def classify(features, purity):
    return [{**p, 'label': p['proposed_label'] if p['vegetation_probability'] >= .5 and p['class_purity'] >= purity else 'uncertain',
             'confidence_calibrated': False, 'human_review_required': True} for p in features]

def cc_runs(item, labels, min_area):
    plants = []
    for cid,label in [(1,'crop'),(2,'weed')]:
        cc, _ = ndimage.label(labels == cid, structure=np.ones((3,3)))
        objects = ndimage.find_objects(cc)
        areas = np.bincount(cc.ravel())
        for i, slices in enumerate(objects,1):
            if slices is None or areas[i] < min_area: continue
            y,x = slices
            plants.append({'id': f'erf-{cid}-{i}', 'box': [x.start/1024,y.start/1024,(x.stop-x.start)/1024,(y.stop-y.start)/1024], 'label': label,
                           'pixels':int(areas[i]), 'provenance':'ERFNet hard-label 8-connected component; not an instance model', 'human_review_required':True})
    return {'image_id':item['id'],'plants':plants,'limited':False,'errors':[]}

def run_phase(phase, geometries, purity, area, selecting=False):
    items = items_for(phase)
    truth = load('baseline/truth.json') if phase != 'confirmatory' else make_truth(items)
    if phase == 'confirmatory': save('confirmatory/truth.json',truth)
    current, features, cc = [], {g:[] for g in ['whole',*geometries,*['whole+'+g for g in geometries]]}, []
    pix = {l: {'intersection':0,'union':0} for l in ['soil','crop','weed']}
    for item in items:
        name = item['id']
        current.append(load(f'results/confirmatory/current/{name}.json' if phase == 'confirmatory' else f'baseline/{phase}/{name}.json'))
        prediction = np.load(ROOT / f'probabilities/{phase}/{name}.npz')
        probs,labels = prediction['probabilities'],prediction['labels']
        semantic = np.array(Image.open(ROOT/item['files']['semantics']['path']))
        semantic[semantic==3]=1;semantic[semantic==4]=2
        valid = semantic != 255
        for cid,label in enumerate(['soil','crop','weed']):
            a,b = (labels==cid)&valid,(semantic==cid)&valid
            pix[label]['intersection'] += int((a&b).sum()); pix[label]['union'] += int((a|b).sum())
        cc.append(cc_runs(item,labels,area))
        whole = load(f'candidates/{phase}/whole/{name}.json')
        groups = {'whole': whole}
        for g in geometries:
            tile = load(f'candidates/{phase}/{g}/{name}.json')
            groups[g] = {**tile,'plants':nms(tile['plants'])}
            groups['whole+'+g] = {'image_id':name,'plants':nms(whole['plants']+tile['plants']), 'limited':whole['limited'] or tile['limited'], 'errors':whole['errors']+tile['errors']}
        for g,run in groups.items():
            feature = {**run,'plants':pool_features(run['plants'],probs)}
            features[g].append(feature)
            save(f'features/{phase}/{g}/{name}.json',feature)
    out = {'current':metrics(current,truth),'erfnet_cc':metrics(cc,truth)}
    for run in cc: save(f'results/{phase}/erfnet_cc/{run["image_id"]}.json',run)
    for g,runs in features.items():
        labeled = [{**r,'plants':classify(r['plants'],purity)} for r in runs]
        out[g+'+erfnet'] = metrics(labeled,truth)
        for run in labeled: save(f'results/{phase}/{g}+erfnet/{run["image_id"]}.json',run)
    for l in pix: pix[l]['pixel_iou'] = pix[l]['intersection']/pix[l]['union'] if pix[l]['union'] else None
    out['semantic_pixel_iou'] = pix
    save(f'results/{phase}/metrics.json',out)
    return out, features, truth

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--phase', required=True, choices=['development','evaluation','confirmatory'])
    parser.add_argument('--select', action='store_true')
    args = parser.parse_args()
    if args.select:
        assert args.phase == 'development'
        out, features, truth = run_phase('development',['tiles640','tiles512'],.75,16,True)
        grid = []
        for geometry,purity in itertools.product(['tiles640','tiles512'],[.6,.75,.9]):
            runs = [{**r,'plants':classify(r['plants'],purity)} for r in features['whole+'+geometry]]
            m = metrics(runs,truth)['aggregate']
            grid.append({'geometry':geometry,'purity':purity,**m})
        eligible = [g for g in grid if g['weed_precision'] >= .9 and g['crop_as_weed_rate'] <= .05]
        pool = eligible or grid
        # F1 balances actual recalls and duplicate/unmatched detections; prefer fewer API calls on a tie.
        best = sorted(pool,key=lambda g:(-g['weed_f1'],-g['weed_precision'],g['geometry']!='tiles640',-g['purity']))[0]
        areas=[]
        for area in [4,16,64]:
            runs=[cc_runs(i,np.load(ROOT/f'probabilities/development/{i["id"]}.npz')['labels'],area) for i in items_for('development')]
            areas.append({'min_area':area,**metrics(runs,truth)['aggregate']})
        best_area=sorted(areas,key=lambda a:(-a['weed_f1'],-a['weed_precision'],-a['min_area']))[0]['min_area']
        selection={'geometry':best['geometry'],'purity':best['purity'],'cc_min_area':best_area,'foreground_probability_min':.5,'nms_iou':.5,
                   'selected_on':'5 original development images only; model training overlap possible','frozen_before_evaluation':True,
                   'candidate_grid':grid,'cc_grid':areas,'selection_rule':'Highest weed F1 among development precision >=.9 and crop-as-weed <=.05 if any; else highest F1. Fewer tiles breaks geometry ties.'}
        assert not (ROOT/'selection.json').exists(), 'Selection already frozen; do not silently retune.'
        save('selection.json',selection)
        out,_,_=run_phase('development',[best['geometry']],best['purity'],best_area)
    else:
        selection=load('selection.json')
        out,_,_=run_phase(args.phase,[selection['geometry']],selection['purity'],selection['cc_min_area'])
    print(json.dumps({k:v['aggregate'] for k,v in out.items() if 'aggregate' in v},indent=2))

if __name__=='__main__': main()
