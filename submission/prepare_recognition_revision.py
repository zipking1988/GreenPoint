"""Freeze the honest 180s r4 story and copy finite public experiment evidence."""
import hashlib,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent
EXPERIMENT=ROOT.parent/'experiments/instance-localization-2026-11-03'

def main():
    previous=json.loads((ROOT/'video/versions/pre-recognition-20261103/storyboard.json').read_text())
    definitions=[
      ('r4-01-hook',0,10,'一个可核查的分歧','23px / CROP OR WEED?',
       'This tiny plant was labeled crop. The annotation says weed. GreenPoint makes that disagreement inspectable.',
       '同一公开图像中的23像素植物：先显示前实验的crop框，再揭示公开标注weed与新农业检测框。保留selected example。','Selected public-data example / local research'),
      ('r4-02-meta',10,24,'用户问题与Meta职责','SAM + MUSE / ONLINE REVIEW FLOW',
       "For growers reviewing scattered fields, a label alone isn't enough. Our online flow uses Sam three point one for plant regions, and Muse Spark for structured visual suggestions.",
       '展示现有真实线上工作区与SAM、Muse职责。明确Recorded real Meta run。','Actual online product / recorded Meta inference'),
      ('r4-03-review',24,48,'一次完整的复核','SOURCE PIXELS → MODEL → HUMAN',
       "Select a candidate. Its box connects to pixels from that exact source image. Zoom and pan: the evidence stays with the plant. Here, the model suggests weed. I keep it for review and save. The original suggestion and my decision remain separate.",
       '使用一次连续GP-001缩放平移，再显示Keep for review、Save与原始/人工状态；不重复展示同类清单。','Actual online review interactions / same session'),
      ('r4-04-export',48,61,'判断随记录导出','A TRACEABLE REVIEW RECORD',
       'Switch to the video inventory, then export. The same review follows the session. The CSV preserves the original label, human status, source, and run identity.',
       '切Video，点击实际导出，放大刚导出的真实CSV字段；不编造表格。','Actual product and exported CSV'),
      ('r4-05-agent',61,82,'Muse实际调用工具','MUSE → MCP → EVIDENCE → HUMAN REVIEW',
       'Muse can request evidence too. In this separate recorded run, it discovers our M C P tools and requests authenticated frame perception. Seven candidates come back. Muse cites evidence IDs and chooses human review.',
       '按discover、perception、human_review顺序各显示一次真实调用回放，并放大公开trace原字段。','Separate real Muse agent trace / software only'),
      ('r4-06-local',82,100,'实际本地农业识别','LOCAL AGRICULTURAL PROTOTYPE',
       'We then tested a local agricultural expert, using published PhenoBench weights. This is real CPU inference on the same RGB frame, with no annotations sent to the model. It is a research prototype, separate from the online Meta flow.',
       '展示本轮实际重新运行的RGB输入、检测输出、运行耗时与模型来源。不是线上功能录屏，不做伪造加载进度。','Actual local CPU output / published pretrained weights'),
      ('r4-07-case',100,117,'定位找回案例','A 51px WEED RECOVERED',
       'On this selected example, the previous pipeline missed a fifty-one-pixel weed. The agricultural detector recovers its box. Both views show the same source pixels, checked against the public annotation.',
       '源图定位51像素目标并放大；并排前方案、新检测器，最后揭示同源GT。放大只用原始像素。','Selected public-data example / same source pixels'),
      ('r4-08-results',117,137,'完整同图评测','SAME 40 IMAGES / FEWER FALSE FLAGS',
       'We chose settings on twenty calibration images, then evaluated forty different images. On that same comparison, weed precision rose from seventy-six point one to ninety-six point seven percent. Recall stayed near sixty-one percent. False weed flags fell from thirty-seven to four.',
       '同40张196株杂草的实验对照：precision76.1→96.7、recall60.2→60.7、falseflags37→4；不得拿另一批39.7%作因果提升。','Frozen local research comparison / full 40-image cohort'),
      ('r4-09-dedup',137,151,'切片碎片去重对照','TILES / CONTAINMENT CLEANUP',
       'Tiles add fragments. Containment cleanup raised tile precision from eighty-seven point two to ninety-two point five percent, with sixty-three point three percent recall.',
       '展示真实切片预测中被包含的小框和保留完整框，接固定消融指标。说明selected整图不使用该去重。','Separate fixed tile ablation / not the primary method'),
      ('r4-10-limits',151,167,'小目标局限与人工复核','KEEP THE REMAINING FAILURES VISIBLE',
       'The smallest weeds remain difficult: nineteen of seventy targets at thirty-two pixels or less were recovered. Human review stays essential. This is public-data validation; movement tracking and independent farm trials remain unvalidated.',
       '显示真实24像素漏检和<=32像素分组26/70→19/70；再显示人工deferred原始结果。源图坐标，无GPS或硬件。','Measured limitations / public agricultural domain only'),
      ('r4-11-close',167,180,'明确当前成果与下一步','EVERY JUDGMENT HAS A FRAME',
       'Inspectable Meta evidence. Traceable human decisions. A tested local recognition prototype. Next: cloud integration and farmer trials. GreenPoint. Every judgment has a frame.',
       '清楚并列已上线Meta复核与本地农业原型，末尾产品名、URL、下一步；不宣称农业原型已上线。','Online Meta review + local research / no hardware'),
    ]
    scenes=[]
    for sid,start,end,title,overlay,narration,action,provenance in definitions:
        scenes.append({'id':sid,'start':start,'end':end,'title':title,'overlay':overlay,'narration':narration,'action_zh':action,'provenance':provenance,
                       'url':'https://greenpoint-vert.vercel.app/dashboard'if start<82 else 'Local research evidence bundled with this submission','lead_seconds':.25,'tail_seconds':.5})
    board={'title':'GreenPoint | Every judgment has a frame','duration_seconds':180,'language':'en-US','voice_direction':'American female; warm, clear, confident; brief pauses for visible actions; no exaggerated advertising delivery.',
           'voice':previous['voice'],'scenes':scenes,'revision':'r4-agricultural-evidence','theme':'Build for Your World',
           'storyline_zh':'23像素判断分歧 → 一次真实Meta复核与导出 → Muse工具调用 → 本地农业识别 → 同图精度提升与去重 → 保留失败 → 当前成果与下一步。',
           'filming_note_zh':'线上段使用已有真实生产录屏；农业段为实际本地推理输出和公开标注的剪辑展示，持续标识Local research prototype，尚未部署。新图像只作原始像素放大和测量结果可视化，不伪造网页或推理进度。',
           'narration_method':'New ElevenLabs Bella American female narration for all 11 revised scenes; provider character timestamps drive captions.',
           'narration_note_zh':'本版11段旁白全部使用此次验证的ElevenLabs Bella美国女声生成；保留原始音频和字符时间戳，不读取密钥到提交包。'}
    (ROOT/'storyboard.json').write_text(json.dumps(board,ensure_ascii=False,indent=2)+'\n')
    dest=ROOT/'evidence/agricultural';dest.mkdir(parents=True,exist_ok=True)
    files=['REPORT.md','REPRODUCE.md','manifest.json','selection.json','selection-freeze.json','results/confirmation/metrics.json','results/verification.json','results/comparison.csv','cases/index.json','results/bootstrap.json','weights-provenance.json']
    for name in files:
        out=dest/name;out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(EXPERIMENT/name,out)
    for name in ['small','recovery','miss','false_positive']:shutil.copy2(EXPERIMENT/f'cases/{name}.png',dest/f'{name}.png')
    cases=json.loads((EXPERIMENT/'cases/index.json').read_text());manifest=json.loads((EXPERIMENT/'manifest.json').read_text())
    sources={}
    for c in cases:
        item=next(i for i in manifest['items']if i['id']==c['image_id']);src=EXPERIMENT/item['files']['images']['path'];out=dest/'images'/c['image_id'];out.parent.mkdir(exist_ok=True);shutil.copy2(src,out)
        assert hashlib.sha256(out.read_bytes()).hexdigest()==item['files']['images']['sha256']
        for variant in ['selected','previous_hybrid','tiles_nms_only','tiles_containment']:
            source=EXPERIMENT/f'results/confirmation/{variant}/{c["image_id"]}.json';target=dest/'predictions'/variant/source.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
        sources[c['category']]={'image_id':c['image_id'],'image':str(out.relative_to(ROOT)),'sha256':item['files']['images']['sha256'],'box':c['box'],'gt_id':c['gt_id'],'size_px':c['size_px'],'previous':c['previous'],'selected':c['selected']}
    (dest/'sources.json').write_text(json.dumps(sources,indent=2)+'\n')
    print(json.dumps({'scenes':len(scenes),'words':sum(len(s['narration'].split())for s in scenes),'narration_characters':sum(len(s['narration'])for s in scenes),'duration':180,'public_case_sources_copied':len(sources)}))
if __name__=='__main__':main()
