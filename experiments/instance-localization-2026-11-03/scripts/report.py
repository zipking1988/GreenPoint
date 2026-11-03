"""Build complete paired evidence, including successes and remaining failures."""
import base64,csv,hashlib,html,io,json,statistics,sys,zipfile
from collections import Counter
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from measurement import ROOT,PREVIOUS,ev,items,load,save
BG='#111513';COLORS={'weed':'#ef987f','crop':'#afc3a4','uncertain':'#e5be75'}
FONT='/System/Library/Fonts/Supplemental/Arial.ttf';BOLD='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def font(n,b=False):return ImageFont.truetype(BOLD if b else FONT,n)
def pct(x):return f'{100*x:.1f}%'
def uri(image):
    b=io.BytesIO();image.save(b,format='JPEG',quality=90);return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
def region(box):
    x,y,w,h=box;side=max(112,min(400,int(max(w,h)*1024*2.5)))
    l=max(0,min(1024-side,int((x+w/2)*1024-side/2)));t=max(0,min(1024-side,int((y+h/2)*1024-side/2)))
    return l,t,l+side,t+side
def render(rgb,plants,crop=None):
    l,t,r,b=crop or (0,0,1024,1024);out=rgb.crop((l,t,r,b)).resize((512,512),Image.Resampling.NEAREST);d=ImageDraw.Draw(out)
    for p in plants:
        x,y,w,h=p['box'];a=(x*1024-l)*512/(r-l);c=(y*1024-t)*512/(b-t);e=((x+w)*1024-l)*512/(r-l);f=((y+h)*1024-t)*512/(b-t)
        if e<0 or f<0 or a>512 or c>512:continue
        color=COLORS[p['label']];d.rectangle([a,c,e,f],outline=color,width=3)
        if crop:
            tx=max(2,min(420,a));ty=max(2,min(490,c-21));label=p['label'];d.rectangle([tx,ty,tx+d.textlength(label,font=font(16))+8,ty+21],fill=BG);d.text((tx+4,ty+1),label,font=font(16),fill=color)
    return out
def error_details(variant,reference):
    count=Counter();images=[]
    for item in items('confirmation'):
        run=load(f'results/confirmation/{variant}/{item["id"]}.json');actual=reference[item['id']]['plants'];matches=ev.match(run['plants'],actual);inverse={gi:pi for pi,gi in matches.items()}
        for gi,g in enumerate(actual):
            if g['label']=='weed':count['correct_weed'if gi in inverse and run['plants'][inverse[gi]]['label']=='weed' else 'no_candidate_match'if gi not in inverse else 'candidate_present_but_'+run['plants'][inverse[gi]]['label']]+=1
        for pi,p in enumerate(run['plants']):
            if p['label']!='weed' or pi in matches and actual[matches[pi]]['label']=='weed':continue
            best=max((ev.iou(p['box'],g['box'])for g in actual if g['label']=='weed'),default=0)
            cause='matched_crop'if pi in matches else 'duplicate'if best>=.5 else 'localization_0.1_to_0.5'if best>=.1 else 'unmatched_other'
            count['fp_'+cause]+=1;images.append({'image_id':item['id'],'prediction_id':p['id'],'cause':cause,'box':p['box'],'best_weed_iou':best})
    result={'variant':variant,'counts':dict(count),'false_positive_weeds':images,'diagnostic_only_no_retuning':True};save(f'results/confirmation/{variant}-errors.json',result);return result
def cases(reference):
    groups={k:[] for k in ['small','recovery','miss','false_positive']}
    index={i['id']:i for i in items('confirmation')}
    for name,actual in reference.items():
        old=load(f'results/confirmation/previous_hybrid/{name}.json')['plants'];new=load(f'results/confirmation/selected/{name}.json')['plants'];g=actual['plants']
        mo={gi:pi for pi,gi in ev.match(old,g).items()};mn={gi:pi for pi,gi in ev.match(new,g).items()}
        for gi,p in enumerate(g):
            if p['label']!='weed':continue
            old_status=old[mo[gi]]['label']if gi in mo else 'no IoU >= .5 match';new_status=new[mn[gi]]['label']if gi in mn else 'no IoU >= .5 match'
            c={'image_id':name,'gt_id':p['id'],'box':p['box'],'size_px':max(p['box'][2:])*1024,'previous':old_status,'selected':new_status}
            if new_status=='weed' and old_status!='weed':groups['recovery'].append(c);groups['small'].extend([c]if c['size_px']<=32 else [])
            if new_status!='weed':groups['miss'].append(c)
        matched=ev.match(new,g)
        for pi,p in enumerate(new):
            if p['label']=='weed' and not(pi in matched and g[matched[pi]]['label']=='weed'):
                groups['false_positive'].append({'image_id':name,'gt_id':None,'box':p['box'],'size_px':max(p['box'][2:])*1024,'previous':'see source','selected':'unmatched weed prediction'})
    chosen=[]
    titles={'small':'A small weed recovered','recovery':'Agricultural instance detection recovers the plant','miss':'A remaining miss','false_positive':'A remaining false positive'}
    for category,pool in groups.items():
        interior=[c for c in pool if 56 <= (c['box'][0]+c['box'][2]/2)*1024 <= 968 and 56 <= (c['box'][1]+c['box'][3]/2)*1024 <= 968]
        pool=interior or pool
        if not pool:continue
        c=min(pool,key=lambda c:(abs(c['size_px']-(24 if category=='small'else 48 if category=='recovery'else 24)),c['image_id']))
        name=c['image_id'];rgb=Image.open(ROOT/index[name]['files']['images']['path']).convert('RGB');crop=region(c['box'])
        old=load(f'results/confirmation/previous_hybrid/{name}.json')['plants'];new=load(f'results/confirmation/selected/{name}.json')['plants'];gt=reference[name]['plants']
        panels=[('Source pixels','Original RGB',render(rgb,[],crop)),('Ground truth','Annotated plants',render(rgb,gt,crop)),('Previous frozen hybrid',c['previous'],render(rgb,old,crop)),('Frozen instance detector',c['selected'],render(rgb,new,crop))]
        sheet=Image.new('RGB',(2112,716),BG);d=ImageDraw.Draw(sheet);d.text((20,16),titles[category],font=font(30,True),fill='white');d.text((20,61),f'{name} | target max side {c["size_px"]:.0f} source pixels | selected confirmation example',font=font(18),fill='#b8c1b9')
        for j,(title,status,panel) in enumerate(panels):
            x=16+j*524;d.text((x,99),title,font=font(21,True),fill='white');d.text((x,124),status,font=font(14),fill='#b8c1b9');sheet.paste(panel,(x,146))
        d.text((20,666),'Crop: sage | Weed: coral | Uncertain: amber | Match: one-to-one IoU >= 0.5 | Nearest-neighbor zoom; no synthesized pixels.',font=font(18),fill='#c6d2c7')
        d.text((20,691),'PhenoBench, Weyler et al., TPAMI 2024 / University of Bonn. Images and derived figure: CC BY-SA 4.0.',font=font(16),fill='#a4aea6')
        out=ROOT/f'cases/{category}.png';out.parent.mkdir(exist_ok=True);sheet.save(out)
        chosen.append({**c,'category':category,'title':titles[category],'figure':str(out.relative_to(ROOT)),'source_sha256':index[name]['files']['images']['sha256'],'selection':'Post-evaluation explanatory examples; not a representative subset',
                       'source_image':uri(render(rgb,[])),'previous_image':uri(render(rgb,old)),'selected_image':uri(render(rgb,new)),'truth_image':uri(render(rgb,gt)),'zoom':uri(sheet.resize((1584,537),Image.Resampling.LANCZOS))})
    save('cases/index.json',[{k:v for k,v in c.items()if not k.endswith('_image')and k!='zoom'}for c in chosen]);return chosen
def main():
    metrics=load('results/confirmation/metrics.json');reference=load('results/confirmation/truth.json');selection=load('selection.json');a=metrics['previous_hybrid']['aggregate'];b=metrics['selected']['aggregate']
    assert a['images']==b['images']==40
    error=error_details('selected',reference);error_details('previous_hybrid',reference)
    records=cases(reference)
    rows=''.join(f'<tr><td>{html.escape(k)}</td><td>{v["aggregate"]["weed_tp"]}/{v["aggregate"]["gt_weed"]}</td><td>{pct(v["aggregate"]["weed_recall"])}</td><td>{pct(v["aggregate"]["weed_precision"])}</td><td>{v["aggregate"]["crop_as_weed"]}/{v["aggregate"]["gt_crop"]}</td></tr>'for k,v in metrics.items())
    buttons=''.join(f'<button data-case="{j}">{html.escape(c["title"])}</button>'for j,c in enumerate(records))
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GreenPoint · Agricultural detection evidence</title><style>*{box-sizing:border-box}body{margin:0;background:#111513;color:#e7ece7;font:16px/1.55 Arial,sans-serif}main{max-width:1320px;margin:auto;padding:32px 24px}h1{font-size:clamp(34px,5vw,58px);line-height:1.1;letter-spacing:-2px;margin:18px 0}.tag{font-size:12px;letter-spacing:2px;color:#d7e7b5}.muted,small{color:#adbaaf}nav,.controls{display:flex;gap:9px;flex-wrap:wrap;margin:24px 0}button{font:inherit;cursor:pointer;padding:9px 13px;background:transparent;color:inherit;border:1px solid #445448;border-radius:6px}button.active,button:hover{background:#d6e5b5;color:#111513}section{padding:25px 0;border-top:1px solid #394a3e}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.image{width:100%;display:block}.stats{display:flex;gap:32px;flex-wrap:wrap;margin:25px 0}.stats strong{display:block;font-size:34px}.stats span{color:#adbaaf}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:10px;border-bottom:1px solid #394a3e}.table{overflow:auto}a{color:#d6e5b5}footer{font-size:12px;color:#adbaaf;margin-top:28px}#meta{overflow-wrap:anywhere;font-size:14px}@media(max-width:750px){.grid{grid-template-columns:1fr}main{padding:22px 15px}}</style><main><div class="tag">GREENPOINT / REAL AGRICULTURAL INSTANCE DETECTION</div><h1>Measure the recovery.<br>Keep the failures visible.</h1><p>Forty image-disjoint public PhenoBench confirmation images. Parameters selected on a separate twenty-image calibration set. No GreenPoint model training.</p><div class="stats"><div><strong>RECALLVALUE</strong><span>weed recall · previous → selected</span></div><div><strong>PRECISIONVALUE</strong><span>selected weed precision</span></div><div><strong>GATEVALUE</strong><span>90% precision / 60% recall / crop errors ≤5%</span></div></div><p class="muted">Research prototype; not a deployed feature or independent-farm validation. Author checkpoints may have used official validation images for model selection. All predictions require human review.</p><nav>CASEBUTTONS</nav><section class="grid"><div><img id="image" class="image" alt="Selected source with real model boxes"><div class="controls"><button data-mode="source_image">Source</button><button data-mode="previous_image">Previous hybrid</button><button data-mode="selected_image">Instance detector</button><button data-mode="truth_image">Ground truth</button></div></div><div><div class="tag" id="category"></div><h2 id="title"></h2><p id="meta"></p><p class="muted">Crop: sage · Weed: coral · Uncertain: amber. Object matches require one-to-one IoU ≥0.5. Examples are selected after evaluation; use the complete table below for the result.</p></div></section><img id="zoom" class="image" alt="The same source-pixel crop compared across annotations and models"><section><h2>Complete paired confirmation</h2><div class="table"><table><thead><tr><th>Method</th><th>Correct / all weeds</th><th>Recall</th><th>Precision</th><th>Crop → weed</th></tr></thead><tbody>TABLEROWS</tbody></table></div><p class="muted">Every confirmation image, partial plant, missed plant and failed main-comparison request remains in the denominator. Optional fresh Muse classification was stopped after repeated provider errors; its incomplete cohort is not presented as a complete method.</p></section><footer>Images and derived figures: PhenoBench, Weyler et al., TPAMI 2024 / University of Bonn. <a href="https://www.phenobench.org/dataset.html">Dataset</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Agricultural detectors: <a href="https://github.com/PRBonn/phenobench-baselines/tree/main/plant_detection">official PhenoBench baselines</a>. No hardware, tracking, GPS or treatment claims.</footer></main><script>const data=CASEDATA;let i=0,mode='selected_image';function render(){const c=data[i];document.getElementById('image').src=c[mode];document.getElementById('zoom').src=c.zoom;document.getElementById('category').textContent=c.category.toUpperCase();document.getElementById('title').textContent=c.title;document.getElementById('meta').textContent=c.image_id+' | '+c.size_px.toFixed(0)+' source pixels | previous: '+c.previous+' | selected: '+c.selected;document.querySelectorAll('[data-case]').forEach(b=>b.classList.toggle('active',+b.dataset.case===i));document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode))}document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{i=+b.dataset.case;render()});document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render()});render();</script></html>'''
    for k,v in {'RECALLVALUE':pct(a['weed_recall'])+' → '+pct(b['weed_recall']),'PRECISIONVALUE':pct(b['weed_precision']),'GATEVALUE':'PASS'if b['target_gates_passed']else'NOT MET','CASEBUTTONS':buttons,'TABLEROWS':rows,'CASEDATA':json.dumps(records).replace('</','<\\/')}.items():page=page.replace(k,v)
    (ROOT/'evidence-gallery.html').write_text(page)
    with (ROOT/'results/comparison.csv').open('w',newline='')as f:
        fields=['method','images','gt_weed','weed_tp','weed_predictions','weed_recall','weed_precision','crop_as_weed','gt_crop','target_gates_passed'];w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
        for method,value in metrics.items():w.writerow({'method':method,**{k:value['aggregate'][k]for k in fields if k!='method'}})
    rng=np.random.default_rng(20261103);idx=rng.integers(0,40,(5000,40));ci={}
    for method in ['previous_hybrid','selected']:
        rows_=metrics[method]['per_image'];tp=np.array([r['weed_tp']for r in rows_]);gt=np.array([r['gt_weed']for r in rows_]);pred=np.array([r['weed_predictions']for r in rows_]);rec=tp[idx].sum(1)/gt[idx].sum(1);prec=np.divide(tp[idx].sum(1),pred[idx].sum(1),out=np.zeros(5000),where=pred[idx].sum(1)>0)
        ci[method]={'recall_image_bootstrap_95':[float(x)for x in np.percentile(rec,[2.5,97.5])],'precision_image_bootstrap_95':[float(x)for x in np.percentile(prec,[2.5,97.5])],'resamples':5000,'scope':'same public domain, image-level resampling only; not farm-independent'}
    save('results/bootstrap.json',ci)
    ledger=json.loads(Path(load('protocol.json')['budget']['shared_ledger']).read_text());entries=[e for e in ledger['entries']if e['label'].startswith('instance-v2:')]
    budget={'this_round_estimated_or_held_usd':sum(e.get('actual_usd',e['reserved_usd'])for e in entries),'shared_total_estimated_or_held_usd':sum(e.get('actual_usd',e['reserved_usd'])for e in ledger['entries']),'unsettled_this_round':sum('actual_usd'not in e for e in entries),'provider_requests_this_round':len(entries),'not_a_reconciled_bill':True,'entries':entries};save('results/budget-snapshot.json',budget)
    table='| 方法 | 正确杂草 / 全部 | 召回率 | 精确率 | 作物→杂草 |\n|---|---:|---:|---:|---:|\n'
    for method,value in metrics.items():
        m=value['aggregate'];table+=f'| {method} | {m["weed_tp"]}/{m["gt_weed"]} | {pct(m["weed_recall"])} | {pct(m["weed_precision"])} | {m["crop_as_weed"]}/{m["gt_crop"]} |\n'
    c=selection['selected'];text=f'''# Agricultural instance localization — 2026-11-03

## 结论

冻结方法：`{json.dumps(c)}`。新 40 张确认图片共有 {b['gt_weed']} 株杂草、{b['gt_crop']} 株作物；正确识别 {b['weed_tp']} 株杂草，预测 {b['weed_predictions']} 个 weed，召回 **{pct(b['weed_recall'])}**、精确率 **{pct(b['weed_precision'])}**、匹配作物误判为 weed **{b['crop_as_weed']}/{b['gt_crop']}**。原定 90% precision / 60% recall / crop-as-weed≤5% 的完整门槛：**{'通过（本公开确认集的点估计）'if b['target_gates_passed']else'未通过，视频继续暂停'}**。

同图、同口径对比上一轮冻结的 SAM＋四切片＋ERFNet：{a['weed_tp']}/{a['gt_weed']}，召回 {pct(a['weed_recall'])}、精确率 {pct(a['weed_precision'])}。以下表格始终覆盖完整 40 张图片。

本次主要收益是降低误报：上一轮混合方法 {a['weed_predictions']-a['weed_tp']} 个 weed 误报降到 {b['weed_predictions']-b['weed_tp']} 个，而正确杂草数仅从 {a['weed_tp']} 增至 {b['weed_tp']}。不能将上一轮另一批 20 张图片的 39.7% 召回，与本轮 60.7% 直接当作同图因果提升。

**小目标存在取舍：≤32px 的70株杂草，前方案找回26株，selected仅19株；切片＋包含去重为21株，仍低于前方案。** 33–64px 从51株提高到58株。整体门槛通过，并不代表最小目标已解决；演示和产品都必须保留这一短板与人工复核。

{table}
## 方法与真实取舍

实际运行官方农业预训练 YOLOv7 与 Faster R-CNN。权重来自 PhenoBench 作者；没有训练新模型、分类头或 LoRA。YOLOv7 使用固定上游 commit 的推理定义与受限 weights-only 加载；Faster R-CNN 用 torchvision 的相同 ResNet50-FPN 架构严格加载官方 state_dict。均为 FP32 CPU 推理，只有 RGB 输入。

分别测试整图、多尺度（整图＋4 个640px切片，偏移0/384，放大到1024）、NMS、内部切片边缘惩罚、同类小框被大框覆盖≥90%的包含去重、ERFNet weed 验证、语义连通域边界修正。参数只由 20 张校准图决定。模型默认阈值与校准阈值分开报告，所有失败校准阶段及完整网格保留。最终候选是上表 `selected`，不得从确认集事后挑另一个方法当赢家。

原始 YOLO 默认 whole-frame 阈值0.25、NMS0.65；官方 Faster R-CNN 对照阈值0.6、NMS0.5（相同预测缓存上的推理适配，非官方原环境逐位复现）。缓存使用低分阈值0.01和高NMS0.95保存候选，再应用明确后处理；每视图上限1000保留并记录 limited。当前 selected 配置若为整图/无去重，即说明复杂流程没有在校准集胜出，不能宣称切片或去重带来了最终提升。

## 数据与验收

20 张校准＋40 张确认图，均为新选官方 val 图片，排除原 45 张及 smoke 图。按 SHA256(instance-localization-v2-20261103:filename) 固定抽样，模型运行前保存清单；RGB、语义和实例标注分别校验 ZIP CRC、字节数与 SHA。20 张用来反复校准；40 张不参与参数和模型选择，选择 SHA 在候选确认推理前冻结。旧 40 张已查看的验证图片没有用于本轮选择。

仍是同一个公开糖甜菜域；作者可能曾以官方 val 选择 checkpoint。图片不重合不等于独立农场、独立拍摄序列或日本手机场景验证。所有 partial、边缘植物、小目标与失败主对照请求保留。计分与上一轮完全相同：class-agnostic、greedy、one-to-one box IoU≥0.5；uncertain 不算正确识别，碎片和重复框计为误报。

## 小目标

| GT 最大边长 | 杂草数 | 上轮混合正确识别 | 本轮 selected 正确识别 |\n|---|---:|---:|---:|\n'''
    for size,row in b['small_target_bins'].items():text+=f'| {size}px | {row["gt_weed"]} | {a["small_target_bins"][size]["weed_tp"]} | {row["weed_tp"]} |\n'
    text+=f'''\n## 剩余错误和案例

`{json.dumps(error['counts'])}`。此为基于标注框的事后诊断，没有拿来重新调参。`cases/` 与交互 `evidence-gallery.html` 展示同一源图的原始像素、标注、前方案和新检测器，包含成功与失败。案例为评分后选取，不能替代全量统计。图片仅做最近邻放大，不补绘或生成细节。

`results/bootstrap.json` 包含5000次图片级bootstrap区间；40张同域图片的小样本相关性限制仍然存在。达标只指该确认集上的观测门槛，不代表置信区间下界过线或现场部署可靠。

## 预算与运行状态

本轮新增估算/保留 ${budget['this_round_estimated_or_held_usd']:.4f}，共享合计 ${budget['shared_total_estimated_or_held_usd']:.4f}，{budget['unsettled_this_round']} 笔本轮 reservation 未结算；这是估算/保留额，不是账单核对金额。农业模型本地推理无 API 费用。新实验 $8 停止、总额 $10 与 $2 回归预留规则保持。

可选的新 Muse 对照遇到多次 provider_error，已停止追加分类调用并保留失败及未知费用 reservation；没有付费自动重试。其不完整图片集不展示为完整方法。主比较 previous_whole / previous_hybrid 使用完整40张实际SAM响应＋同源ERFNet，完整计入失败。

本轮产物是可运行研究原型及证据，尚未替换线上服务。`scripts/recognize.py --image <1024px-RGB> --output <目录>` 可真实本地推理并导出框、类别、来源和耗时，不读取标注。视频文件在本轮实验阶段未改动；{'可以进入接入产品与新演示验证阶段，不能把研究原型讲成已部署功能。'if b['target_gates_passed']else'门槛未过前继续暂停视频。'}

## 来源与复现

[官方农业模型与权重](https://github.com/PRBonn/phenobench-baselines/tree/main/plant_detection)，[YOLOv7固定commit](https://github.com/WongKinYiu/yolov7/tree/84932d70fb9e2932d0a70e4a1f02a1d6dd1dd6ca)，[PhenoBench数据](https://www.phenobench.org/dataset.html)。Weyler et al., PhenoBench, IEEE TPAMI 2024 / University of Bonn；数据及衍生图片遵循 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。原YOLOv7代码许可保留于 vendor/upstream/LICENSE.md。权重及运行环境不放入公开证据包。

完整结果、输入清单、参数选择历史、冻结SHA、模型SHA、原始推理响应和独立核验脚本均保留；详见 REPRODUCE.md。
'''
    (ROOT/'REPORT.md').write_text(text)
    print(json.dumps({'primary_pass':b['target_gates_passed'],'recall':b['weed_recall'],'precision':b['weed_precision'],'cases':len(records),'report':str(ROOT/'REPORT.md')}))
if __name__=='__main__':main()
