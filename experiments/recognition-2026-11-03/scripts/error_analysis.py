"""Post-evaluation diagnosis only; does not modify thresholds or predictions."""
import argparse
from collections import Counter

import evaluate as ev

parser=argparse.ArgumentParser()
parser.add_argument('--phase',required=True,choices=['development','evaluation','confirmatory'])
args=parser.parse_args()
selection=ev.load('selection.json')
variant='whole+'+selection['geometry']+'+erfnet'
truth=ev.load('confirmatory/truth.json' if args.phase=='confirmatory' else 'baseline/truth.json')
totals=Counter(); details=[]
for item in ev.items_for(args.phase):
    run=ev.load(f'results/{args.phase}/{variant}/{item["id"]}.json')
    actual=truth[item['id']]['plants'];plants=run['plants'];pairs=ev.match(plants,actual)
    inverse={gi:pi for pi,gi in pairs.items()}
    image={'image_id':item['id'],'missed_weeds':[],'false_positive_weeds':[]}
    for gi,g in enumerate(actual):
        if g['label']!='weed':continue
        if gi not in inverse:
            kind='no_candidate_match'
        elif plants[inverse[gi]]['label']=='weed':
            kind='correct_weed'
        else:
            kind='candidate_present_but_'+plants[inverse[gi]]['label']
        totals[kind]+=1
        if kind!='correct_weed':image['missed_weeds'].append({'gt_id':g['id'],'box':g['box'],'size_bin':ev.size_bin(g),'cause':kind,'best_candidate_iou':max([ev.iou(g['box'],p['box']) for p in plants],default=0.)})
    for pi,p in enumerate(plants):
        if p['label']!='weed' or pi in pairs and actual[pairs[pi]]['label']=='weed':continue
        weed_best=max([ev.iou(p['box'],g['box']) for g in actual if g['label']=='weed'],default=0.)
        crop_best=max([ev.iou(p['box'],g['box']) for g in actual if g['label']=='crop'],default=0.)
        kind='matched_crop' if pi in pairs else 'duplicate_weed_match' if weed_best>=.5 else 'weed_localization_iou_0.1_to_0.5' if weed_best>=.1 else 'unmatched_other'
        totals['false_positive_'+kind]+=1
        image['false_positive_weeds'].append({'prediction_id':p['id'],'box':p['box'],'cause':kind,'best_weed_iou':weed_best,'best_crop_iou':crop_best})
    details.append(image)
report={'phase':args.phase,'variant':variant,'diagnostic_only_no_retuning':True,'counts':dict(totals),'images':details,
        'notes':'Unmatched weed predictions may be fragments, duplicate detections, poor boxes or semantic errors. Categories use box overlap with annotations, not a causal claim or independent farm validation.'}
ev.save(f'results/{args.phase}/error-analysis.json',report)
print(dict(totals))
