"""Create an auditable report and photographic evidence cases from frozen outputs."""
import base64
import csv
import hashlib
import html
import io
import json
import platform
import statistics
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

import evaluate as ev

ROOT=ev.ROOT
SELECTION=ev.load('selection.json')
HYBRID='whole+'+SELECTION['geometry']+'+erfnet'
COLORS={'crop':'#afc3a4','weed':'#ef987f','uncertain':'#e5be75'}
BG='#111513'
FONT='/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def font(n,bold=False): return ImageFont.truetype(BOLD if bold else FONT,n)
def pct(x): return f'{100*x:.1f}%'
def save(path,value): ev.save(path,value)
def read_runs(phase,variant):
    folder=f'baseline/{phase}' if variant=='current' and phase!='confirmatory' else f'results/{phase}/{variant}'
    return {i['id']:ev.load(f'{folder}/{i["id"]}.json') for i in ev.items_for(phase)}

def bootstrap(metrics, key, numerator, denominator, count=5000):
    a=metrics['current']['per_image']; b=metrics[key]['per_image']
    assert [x['image_id'] for x in a]==[x['image_id'] for x in b]
    rng=np.random.default_rng(20261103)
    inds=rng.integers(0,len(a),size=(count,len(a)))
    def calc(rows):
        num=np.array([r[numerator] for r in rows]);den=np.array([r[denominator] for r in rows]);d=den[inds].sum(1)
        return np.divide(num[inds].sum(1),d,out=np.zeros(count),where=d>0)
    delta=calc(b)-calc(a)
    return {'metric':numerator+'/'+denominator,'paired_image_bootstrap_resamples':count,'seed':20261103,
            'delta_pp':100*(metrics[key]['aggregate'][numerator]/metrics[key]['aggregate'][denominator]-metrics['current']['aggregate'][numerator]/metrics['current']['aggregate'][denominator]),
            'percentile_95_interval_pp':[float(x) for x in np.percentile(delta*100,[2.5,97.5])],
            'scope':'20 correlated public-domain images, image-level resampling; no independent-farm generalization inference'}

def crop_region(box):
    x,y,w,h=box;side=max(112,min(420,int(max(w,h)*1024*2.8)))
    l=max(0,min(1024-side,int((x+w/2)*1024-side/2)));t=max(0,min(1024-side,int((y+h/2)*1024-side/2)))
    return l,t,l+side,t+side

def annotated(rgb,plants,region=None,target=None):
    region=region or (0,0,1024,1024)
    l,t,r,b=region
    out=rgb.crop(region).resize((512,512),Image.Resampling.NEAREST)
    draw=ImageDraw.Draw(out)
    for p in plants:
        x,y,w,h=p['box'];left=(x*1024-l)*512/(r-l);top=(y*1024-t)*512/(b-t)
        right=((x+w)*1024-l)*512/(r-l);bottom=((y+h)*1024-t)*512/(b-t)
        if right<0 or bottom<0 or left>512 or top>512:continue
        color=COLORS[p.get('label','uncertain')]
        draw.rectangle([left,top,right,bottom],outline=color,width=3)
        if region!=(0,0,1024,1024):
            text=p.get('label','candidate')
            tx=max(2,min(440,left));ty=max(2,min(487,top-22))
            draw.rectangle([tx,ty,tx+draw.textlength(text,font=font(16))+9,ty+21],fill=BG)
            draw.text((tx+4,ty+2),text,font=font(16),fill=color)
    if target:
        x,y,w,h=target
        box=[(x*1024-l)*512/(r-l)-5,(y*1024-t)*512/(b-t)-5,((x+w)*1024-l)*512/(r-l)+5,((y+h)*1024-t)*512/(b-t)+5]
        draw.rectangle(box,outline='white',width=1)
    return out

def uri(image):
    data=io.BytesIO();image.save(data,format='JPEG',quality=90)
    return 'data:image/jpeg;base64,'+base64.b64encode(data.getvalue()).decode()

def choose_cases(phase):
    truth=ev.load('confirmatory/truth.json' if phase=='confirmatory' else 'baseline/truth.json')
    current=read_runs(phase,'current');whole=read_runs(phase,'whole+erfnet');hybrid=read_runs(phase,HYBRID)
    selections={}
    pools={'small':[],'classification':[],'missed':[],'falsepositive':[]}
    for image_id,entry in truth.items():
        if image_id not in hybrid:continue
        actual=entry['plants']
        mappings={key:{gi:pi for pi,gi in ev.match(run[image_id]['plants'],actual).items()} for key,run in [('current',current),('whole',whole),('hybrid',hybrid)]}
        for gi,g in enumerate(actual):
            if g['label']!='weed':continue
            status={key:run[image_id]['plants'][mappings[key][gi]].get('label') if gi in mappings[key] else 'missed' for key,run in [('current',current),('whole',whole),('hybrid',hybrid)]}
            size=max(g['box'][2:])*1024
            candidate={'image_id':image_id,'gt_id':g['id'],'box':g['box'],'size_px':size,'status':status,'ground_truth_label':'weed'}
            if status['hybrid']=='weed' and status['whole']=='missed' and size<=64:pools['small'].append(candidate)
            if status['hybrid']=='weed' and status['whole']=='weed' and status['current']!='weed':pools['classification'].append(candidate)
            if status['hybrid']!='weed':pools['missed'].append(candidate)
        matched=ev.match(hybrid[image_id]['plants'],actual)
        for pi,p in enumerate(hybrid[image_id]['plants']):
            if p['label']=='weed' and not (pi in matched and actual[matched[pi]]['label']=='weed'):
                best=max((ev.iou(p['box'],g['box']) for g in actual),default=0)
                pools['falsepositive'].append({'image_id':image_id,'gt_id':None,'prediction_id':p['id'],'box':p['box'],'size_px':max(p['box'][2:])*1024,'best_gt_iou':best,'ground_truth_label':'unmatched weed prediction','status':{'current':'see image','whole':'see image','hybrid':'weed / false positive at IoU .5'}})
    # Readable explanatory cases are selected AFTER scoring, never used for parameter selection.
    for key in pools:
        pool=sorted(pools[key],key=lambda c:(c['size_px'],c['image_id'],c.get('gt_id') or 0))
        interior=[c for c in pool if 56 <= (c['box'][0]+c['box'][2]/2)*1024 <= 968 and 56 <= (c['box'][1]+c['box'][3]/2)*1024 <= 968]
        if key=='small' and interior:pool=interior
        if key in ['classification','missed']:pool=sorted(interior or pool,key=lambda c:(abs(c['size_px']-(48 if key=='classification' else 24)),c['image_id']))
        if key=='falsepositive':pool=sorted(pool,key=lambda c:(-c['best_gt_iou'],c['image_id']))
        if pool:selections[key]=pool[0]
    tiny=sorted([c for c in pools['small'] if c['size_px']<=32],key=lambda c:(c['size_px'],c['image_id']))
    if tiny and tiny[0]!=selections.get('small'):selections['tiny']=tiny[0]
    items={i['id']:i for i in ev.items_for(phase)}
    titles={'small':'Small weed recovered by zooming','tiny':'A 16-pixel border weed recovered','classification':'Same plant, agricultural evidence','missed':'A remaining miss','falsepositive':'A prediction that fails the box test'}
    descriptions={
      'small':'The whole-frame SAM run has no IoU >= 0.5 match. The frozen tile pipeline recovers this annotated weed and labels it weed.',
      'tiny':'This 16-pixel weed is at the source-image border. Whole-frame SAM misses it; the tile pipeline recovers it. Border plants stay in the benchmark denominator.',
      'classification':'The SAM candidate already existed. Pooling pretrained agricultural predictions over its SAM mask resolves the original uncertain/misclassified label.',
      'missed':'The frozen hybrid still misses this annotated weed or leaves its class unresolved. This failure remains in the reported denominator.',
      'falsepositive':'The hybrid labels this box weed, but it does not receive a one-to-one weed match at IoU >= 0.5. Fragments and poor boxes count against precision.'}
    cases=[]
    for key,c in selections.items():
        item=items[c['image_id']];rgb=Image.open(ROOT/item['files']['images']['path']).convert('RGB');region=crop_region(c['box'])
        actual=truth[c['image_id']]['plants']
        panels=[('Source pixels',rgb.crop(region).resize((512,512),Image.Resampling.NEAREST)),
                ('Ground-truth boxes',annotated(rgb,actual,region,c['box'] if c['gt_id'] is not None else None)),
                ('Current: SAM + Muse',annotated(rgb,current[c['image_id']]['plants'],region)),
                ('Frozen hybrid',annotated(rgb,hybrid[c['image_id']]['plants'],region))]
        sheet=Image.new('RGB',(2112,716),BG);draw=ImageDraw.Draw(sheet)
        draw.text((24,18),titles[key],font=font(30,True),fill='white')
        target_type='target' if c['gt_id'] is not None else 'selected prediction'
        draw.text((24,61),f'{c["image_id"]} | {target_type} max side {c["size_px"]:.0f} source pixels | selected {phase} example',font=font(18),fill='#b8c1b9')
        for index,(title,panel) in enumerate(panels):
            x=16+index*524;draw.text((x,99),title,font=font(21,True),fill='white')
            status=['Original RGB crop',c['ground_truth_label'],c['status']['current'],c['status']['hybrid']][index]
            if status=='missed':status='No IoU >= 0.5 match'
            if index==1 and c['gt_id'] is None:status='Annotated reference plants'
            draw.text((x,123),status,font=font(14),fill='#b8c1b9');sheet.paste(panel,(x,146))
        draw.text((24,666),'Crop: sage | Weed: coral | Uncertain: amber | White: GT target | Object match: IoU >= 0.5 | Nearest-neighbor zoom; no synthesized pixels.',font=font(18),fill='#d4dcd4')
        draw.text((24,691),'PhenoBench, Weyler et al., TPAMI 2024 / University of Bonn. Dataset and derived figure: CC BY-SA 4.0.',font=font(16),fill='#a4aea6')
        path=f'cases/{phase}-{key}.png';sheet.save(ROOT/path)
        c.update(category=key,title=titles[key],description=descriptions[key],figure=path,source_sha256=item['files']['images']['sha256'],selection='Post-evaluation illustrative example; not representative of aggregate performance',scope=phase,
                 source=uri(annotated(rgb,[],target=c['box'])),current=uri(annotated(rgb,current[c['image_id']]['plants'],target=c['box'])),hybrid=uri(annotated(rgb,hybrid[c['image_id']]['plants'],target=c['box'])),truth=uri(annotated(rgb,actual,target=c['box'])),zoom=uri(sheet.resize((1584,537),Image.Resampling.LANCZOS)))
        cases.append(c)
    save('cases/index.json',[{k:v for k,v in c.items() if k not in ['source','current','hybrid','truth','zoom']} for c in cases])
    return cases

def build_gallery(cases,metrics):
    a=metrics['current']['aggregate'];b=metrics[HYBRID]['aggregate']
    cards=''.join(f'<button class="case" data-case="{i}"><span>0{i+1}</span>{html.escape(c["title"])}</button>' for i,c in enumerate(cases))
    rows=''.join(f'<tr><td>{html.escape(k)}</td><td>{v["aggregate"]["weed_tp"]}/{v["aggregate"]["gt_weed"]} · {pct(v["aggregate"]["weed_recall"])}</td><td>{pct(v["aggregate"]["weed_precision"])}</td><td>{v["aggregate"]["crop_as_weed"]}/{v["aggregate"]["gt_crop"]}</td></tr>' for k,v in metrics.items() if 'aggregate'in v)
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GreenPoint · Recognition evidence</title>
<style>*{box-sizing:border-box}body{margin:0;background:#111513;color:#e5eae5;font:16px/1.5 Arial,sans-serif}main{max-width:1320px;margin:auto;padding:36px 28px}header{border-bottom:1px solid #39443b;padding-bottom:30px}small,.muted{color:#aab7ad}h1{font-size:clamp(32px,5vw,58px);line-height:1.08;letter-spacing:-2px;margin:16px 0}h2{font-size:26px;margin:14px 0}p{max-width:850px}.tag{font-size:12px;letter-spacing:2px;color:#d6e9aa}.stats{display:flex;gap:32px;flex-wrap:wrap;margin:25px 0}.stats strong{font-size:35px;display:block}.stats span{color:#aab7ad;font-size:14px}button{font:inherit;cursor:pointer;color:inherit;border:1px solid #455148;background:transparent;padding:10px 15px;border-radius:6px}button:hover,button.active{background:#d4e5ac;color:#111513;border-color:#d4e5ac}nav{display:flex;gap:10px;flex-wrap:wrap;margin:30px 0 22px}.case span{opacity:.6;margin-right:10px}.stage{display:grid;grid-template-columns:1fr 1fr;gap:25px;align-items:start}.frame{width:100%;display:block;background:#202922;border-radius:6px}.controls{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.controls button{font-size:13px}.description{padding:12px 0}#case-meta{font:13px/1.7 monospace;overflow-wrap:anywhere}.zoom{width:100%;margin:20px 0;border:1px solid #39443b}section{padding:28px 0;border-bottom:1px solid #39443b}table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:12px;border-bottom:1px solid #39443b}th{color:#aab7ad}footer{padding:28px 0;color:#aab7ad;font-size:12px}a{color:#d4e5ac}.table{overflow:auto}@media(max-width:760px){main{padding:22px 16px}.stage{grid-template-columns:1fr}.stats{gap:22px}td,th{padding:8px}.case{font-size:13px}}</style>
<main><header><div class="tag">GREENPOINT / RECOGNITION LAB / REAL MODEL OUTPUTS</div><h1>Find the weed.<br>Show the evidence.</h1><p>Frozen parameters. Twenty new public agricultural images. Every missed plant and failed request stays in the score.</p><div class="stats"><div><strong>RECALL</strong><span>weed recall · current → hybrid</span></div><div><strong>PRECISION</strong><span>hybrid weed precision</span></div><div><strong>CROPERROR</strong><span>matched crops labeled weed</span></div></div><small>Research prototype, separate from the deployed product. Published ERFNet weights; no model trained by GreenPoint. Human review required.</small></header>
<nav>CARDS</nav><section class="stage"><div><img id="overview" class="frame" alt="Selected source with source-coordinate boxes"><div class="controls"><button data-mode="source">Source</button><button data-mode="current">Current</button><button data-mode="hybrid">Hybrid</button><button data-mode="truth">Ground truth</button></div><small>Crop: sage · Weed: coral · Uncertain: amber. White marks the evaluation target.</small></div><div class="description"><div class="tag" id="category"></div><h2 id="case-title"></h2><p id="case-description"></p><p id="case-meta" class="muted"></p><p class="muted">The examples below were selected after evaluation to explain a recovery and a failure. Use the complete comparison table to assess performance.</p></div></section><img id="zoom" class="zoom" alt="Source, ground truth, original pipeline and frozen hybrid at the same source-pixel crop">
<section><h2>Complete confirmation comparison</h2><p class="muted">One-to-one class-agnostic IoU ≥ 0.5. All annotated plants, including partial border plants, stay in the denominator. ERFNet CC uses an explicit connected-component adapter; it is a semantic model, so fragments and merged plants affect its object scores.</p><div class="table"><table><thead><tr><th>Method</th><th>Weed recall</th><th>Weed precision</th><th>Crop → weed</th></tr></thead><tbody>ROWS</tbody></table></div><p class="muted">The hybrid has not met every deployment gate. These are image-disjoint confirmation results within PhenoBench, not independent-farm or Japanese phone-camera validation. The authors’ pretrained checkpoint may have used the official validation split for model selection.</p></section>
<footer>Images and derived figures: PhenoBench / University of Bonn, Weyler et al., TPAMI 2024. <a href="https://www.phenobench.org/dataset.html">Dataset</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Agricultural model: <a href="https://github.com/PRBonn/phenobench-baselines">official PhenoBench ERFNet</a>. SAM 3.1 supplies masks; Muse Spark supplies original-pipeline classifications. The frozen hybrid uses ERFNet for classification. No GPS, tracking or treatment claims.</footer></main>
<script>const cases=CASEDATA;let selected=0,mode='hybrid';function render(){const c=cases[selected];document.getElementById('overview').src=c[mode];document.getElementById('zoom').src=c.zoom;document.getElementById('case-title').textContent=c.title;document.getElementById('case-description').textContent=c.description;document.getElementById('category').textContent=c.category.toUpperCase();document.getElementById('case-meta').textContent=c.image_id+' | target '+c.size_px.toFixed(0)+'px | current: '+c.status.current+' | hybrid: '+c.status.hybrid;document.querySelectorAll('[data-case]').forEach(b=>b.classList.toggle('active',+b.dataset.case===selected));document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode))}document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{selected=+b.dataset.case;render()});document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render()});render();</script></html>'''
    replacements={'RECALL':pct(a['weed_recall'])+' → '+pct(b['weed_recall']),'PRECISION':pct(b['weed_precision']),'CROPERROR':str(b['crop_as_weed'])+'/'+str(b['gt_crop']),'CARDS':cards,'ROWS':rows,'CASEDATA':json.dumps(cases).replace('</','<\\/')}
    for k,v in replacements.items():page=page.replace(k,v)
    (ROOT/'evidence-gallery.html').write_text(page)

def main():
    all_metrics={p:ev.load(f'results/{p}/metrics.json') for p in ['development','evaluation','confirmatory']}
    intervals={p:bootstrap(m,HYBRID,'weed_tp','gt_weed') for p,m in all_metrics.items() if p!='development'}
    save('results/paired-bootstrap.json',intervals)
    with (ROOT/'results/comparison.csv').open('w',newline='') as f:
        fields=['cohort','method','images','gt_weed','weed_tp','weed_predictions','weed_recall','weed_precision','weed_candidate_recall','crop_as_weed','gt_crop','uncertain_rate','failed_images']
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
        for phase,methods in all_metrics.items():
            for method,v in methods.items():
                if 'aggregate'in v:writer.writerow({'cohort':phase,'method':method,**{k:v['aggregate'][k] for k in fields if k not in ['cohort','method']}})
    cases=choose_cases('confirmatory')
    build_gallery(cases,all_metrics['confirmatory'])
    ledger=json.loads(Path(ev.load('protocol.json')['budget']['shared_ledger']).read_text())
    entries=[e for e in ledger['entries'] if e['label'].startswith('recognition-v2:')]
    budget={'estimated_or_held_usd_total':sum(e.get('actual_usd',e['reserved_usd']) for e in ledger['entries']),
            'this_experiment_estimated_or_held_usd':sum(e.get('actual_usd',e['reserved_usd']) for e in entries),
            'provider_requests_this_experiment':len(entries),'unsettled_this_experiment':sum('actual_usd' not in e for e in entries),
            'not_a_reconciled_bill':True,'new_experiments_stop_usd':8,'total_limit_usd':10,'entries':entries}
    save('results/budget-snapshot.json',budget)
    timing={}
    for phase in all_metrics:
        values=[json.loads(p.read_text())['inference_seconds'] for p in (ROOT/f'probabilities/{phase}').glob('*.json')]
        timing[phase]={'images':len(values),'cpu_inference_median_seconds':statistics.median(values),'cpu_inference_mean_seconds':statistics.mean(values),'note':'Forward pass only; development ran alone, evaluation/confirmation ran concurrently on CPU. Not end-to-end latency.'}
    save('results/runtime.json',{'python':platform.python_version(),'platform':platform.platform(),'timing':timing})
    new=all_metrics['confirmatory'];a=new['current']['aggregate'];b=new[HYBRID]['aggregate'];error=ev.load('results/confirmatory/error-analysis.json')['counts']
    text=f'''# GreenPoint recognition experiments — 2026-11-03

视频制作已暂停。本次完成的是可复现的识别实验、本地识别原型与真实案例，尚未部署到线上。

## 决策

**暂不训练 crop/weed 分类头。** 在新 20 张确认图片上，原方案识别 {a['weed_tp']}/{a['gt_weed']} 株杂草（召回 {pct(a['weed_recall'])}），锁定的混合方案识别 {b['weed_tp']}/{b['gt_weed']}（{pct(b['weed_recall'])}），精确率 {pct(b['weed_precision'])}。保留了所有漏检、部分边缘植物与失败请求。

混合方案仍有 {error.get('no_candidate_match',0)} 株杂草没有 IoU≥0.5 的候选匹配；有候选但判错/不确定共 {error.get('candidate_present_but_crop',0)+error.get('candidate_present_but_uncertain',0)} 株。此结果把优先级指向小目标定位、实例碎片与去重，现阶段新增分类头解决不了主要漏检。分类头后续应由真实目标农田的独立数据和成组划分实验决定，而不是为了比赛宣称“训练了模型”。

固定这批候选，即使分类器完全分对，也最多覆盖 {b['weed_candidate_matches']}/{b['gt_weed']} 株杂草（{pct(b['weed_candidate_recall'])}），仍低于 60% 召回目标。仅替换农业判别、不加切片的整图方案为 {new['whole+erfnet']['aggregate']['weed_tp']}/{b['gt_weed']}，精确率 {pct(new['whole+erfnet']['aggregate']['weed_precision'])}；它更适合作为下一版人工复核识别功能的优先集成候选。切片在这批新图片上只额外找回 {b['weed_tp']-new['whole+erfnet']['aggregate']['weed_tp']} 株，且增加误报，保留为研究开关，尚不作为线上默认。这里是依据验证结果作出的产品取舍，没有改动冻结参数或重新选择测试结果。

原定门槛为 weed precision ≥90%、recall ≥60%、crop→weed ≤5%；本轮混合方案通过状态：**{b['target_gates_passed']}**。当前只能进入人工复核研究流程。

## 数据与冻结

- 5 张官方 train 图片仅用于选参数；公开农业模型可能已经训练过这些图片，所以开发集不作泛化证据。
- 旧 20 张官方 val 是先前检查过的诊断集，用于配对比较。
- 新 20 张官方 val 在本轮推理前按 SHA256(recognition-v2-20261103:filename) 选定，与原 25 张及旧 smoke 图片不重合；选择文件、输入 SHA 和冻结参数 SHA 均保留。
- 新集只对本轮选择过程保持独立。作者预训练 checkpoint 可能曾用官方 val 选模型；同一公开农业域不等于独立农场、跨作物、日本手机拍摄或现场验证。
- 只有 RGB 进入模型；标注由评分脚本单独加载。没有训练、人工补标签或测试集调参。

## 方法

1. **Current**：当前真实 SAM 3.1 whole-frame + Muse Spark 1.3 baseline；旧集复用原始响应，新确认集实际重跑同一实现、提示与 0.75 置信阈值。
2. **ERFNet CC**：官方 PhenoBench 预训练 ERFNet，原始 1024 RGB、逐图通道均值/样本标准差、3 类语义输出，8 邻域连通域转 box，最少 {SELECTION['cc_min_area']} 像素。语义模型不是实例模型，碎片、合并和重复都会计入对象错误。
3. **Whole + ERFNet**：保留原 SAM 候选；用官方 SAM 解码掩膜内 ERFNet 概率均值判别，隔离分类变化。
4. **Tiles + ERFNet**：四个 640px tile，坐标偏移 0/384，每块放大到 1024 送 SAM，按源图重投影，IoU≥0.5 NMS。
5. **Whole + tiles + ERFNet**：整图和切片候选合并；相同分类器与相同 NMS。植被概率均值 ≥0.5、crop/weed 概率纯度 ≥{SELECTION['purity']} 才赋类，否则 uncertain；数值未校准、均需人工复核。

开发阶段也运行了九个 512px tile；其表现更差，没有进入最终验证。参数仅从开发集一次选择，随后冻结。农业权重来自作者，不是我们训练，也不是 Meta 模型；Meta 在混合方案中贡献 SAM 分割，Muse 仍属于原方案比较和现有产品的独立 agent/MCP 工作流。

## 真实配对结果

评分使用与原 benchmark 完全一致的 class-agnostic、greedy、one-to-one box IoU≥0.5。重复预测和没有匹配的 weed 都降低精确率；uncertain 不计为正确识别。像素 IoU 独立报告，不能与对象召回混为一谈。
'''
    for phase in ['evaluation','confirmatory']:
        text+='\n### '+('旧诊断集（20 张）' if phase=='evaluation' else '新确认集（20 张）')+'\n\n| 方法 | 正确杂草 / 全部杂草 | 召回率 | 精确率 | 作物→杂草 | 候选覆盖杂草 |\n|---|---:|---:|---:|---:|---:|\n'
        for method,v in all_metrics[phase].items():
            if 'aggregate'not in v:continue
            m=v['aggregate'];text+=f'| {method} | {m["weed_tp"]}/{m["gt_weed"]} | {pct(m["weed_recall"])} | {pct(m["weed_precision"])} | {m["crop_as_weed"]}/{m["gt_crop"]} | {pct(m["weed_candidate_recall"])} |\n'
        ci=intervals[phase];lo,hi=ci['percentile_95_interval_pp']
        sem=all_metrics[phase]['semantic_pixel_iou']
        text+=f'\n混合方案相对原方案的召回变化：{ci["delta_pp"]:+.1f} 个百分点；按图片配对 bootstrap 5000 次的 95% 区间 [{lo:+.1f}, {hi:+.1f}] 个百分点。这是小规模、同域、相关图片的描述性区间，不能支持独立农场结论。ERFNet 像素 IoU：crop {pct(sem["crop"]["pixel_iou"])}，weed {pct(sem["weed"]["pixel_iou"])}。\n'
    text+='\n## 新确认集的小目标\n\n| GT 最大边长（源像素） | 杂草数 | 整图候选匹配 | 混合候选匹配 | 混合正确识别 |\n|---|---:|---:|---:|---:|\n'
    for size,values in b['small_target_bins'].items():
        old=a['small_target_bins'][size]
        text+=f'| {size} | {values["gt_weed"]} | {old["candidate_matches"]} | {values["candidate_matches"]} | {values["weed_tp"]} |\n'
    text+=f'''\n## 剩余错误与训练判断

新集错误拆解：`{json.dumps(error,ensure_ascii=False)}`。这是按标注框几何关系的事后诊断，不是模型内部原因的证明，也没有据此回调参数。若把目前所有已匹配但分类错误的杂草全部分对，分类头在固定候选上的理论额外收益也仅为 {100*(error.get('candidate_present_but_crop',0)+error.get('candidate_present_but_uncertain',0))/b['gt_weed']:.1f} 个百分点；没有候选的杂草仍不会被找回。

建议保留农业预训练模型作为糖甜菜域专家，下一轮优先比较真正的农业实例检测/分割基线，处理切片边缘碎片和重复框，并用新的农场/拍摄序列成组留出。新分类头应等到同域定位达标、分类错误确实成为主要瓶颈，再使用独立训练集和新的测试集验证。当前确认集此后属于已查看的诊断数据，不能继续称为未触碰测试集。

## 案例与演示

打开 `evidence-gallery.html` 可切换原图、原方案、混合方案和人工标注，查看相同像素的局部放大。`cases/` 保存真实图片对照，包含恢复成功与剩余失败；图片均在评分后按类别选取，不能替代完整统计。

面向 judge 的真实亮点是：**“General-purpose segmentation misses tiny weeds. We tested a zoomed agricultural pipeline, measured the recovery, and kept every remaining failure visible.”** 具体数字以确认集表格为准。没有训练声明、GPS、机器人动作、跨帧跟踪或除草收益声明；视频继续暂停。

## 预算与复现

本轮请求 {budget['provider_requests_this_experiment']} 次，新增估算/保留 ${budget['this_experiment_estimated_or_held_usd']:.4f}，共享总估算/保留 ${budget['estimated_or_held_usd_total']:.4f}；{budget['unsettled_this_experiment']} 笔本轮费用未结算，保留原 reservation。不是账单核对金额。没有自动付费重试。离线 ERFNet 推理 API 费用为 0。

`scripts/verify.py` 核对 45 组输入/标注 SHA、确认集不重合、旧 20 张原始指标完全复现，以及重复框和 crop→weed 的计分不变量。`scripts/recognize.py` 是可重复运行的本地 RGB 识别入口，可选同源 SAM 候选；输出语义掩膜、框、标签与来源，不读取标注。

静态图片已逐类检查；案例页内嵌图片与 5×4 种切换路径通过 JavaScript 执行核验。浏览器自动化连接两次超时，未完成浏览器渲染实测；不把它记录为浏览器 QA 通过。

详见 `REPRODUCE.md`、`protocol.json`、`selection.json`、`selection-freeze.json`、`results/comparison.csv`、`results/*/error-analysis.json` 和原始响应。权重 SHA：`06252edf0e4d75a288d5f2d45bd386393e117454787dad93c5cdaa65e2c66fe2`。

## 来源

农业模型与权重：[PRBonn 官方 PhenoBench baselines](https://github.com/PRBonn/phenobench-baselines/tree/main/semantic_segmentation)。数据与标注：[PhenoBench dataset](https://www.phenobench.org/dataset.html)。Weyler et al., “PhenoBench — A Large Dataset and Benchmarks for Semantic Image Interpretation in the Agricultural Domain,” IEEE TPAMI, 2024。数据及衍生图片遵循 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。模型/架构文件仅在本地研究使用；权重和运行环境不打入公开展示包。
'''
    (ROOT/'REPORT.md').write_text(text)
    print(json.dumps({'report':str(ROOT/'REPORT.md'),'gallery':str(ROOT/'evidence-gallery.html'),'cases':len(cases),'confirmation_recall':b['weed_recall'],'confirmation_precision':b['weed_precision'],'training_head':'defer'},indent=2))

if __name__=='__main__':main()
