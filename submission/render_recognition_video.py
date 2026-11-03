"""180-second r4 film: real product recordings + actual local research evidence.

Research panels are openly editorial views of saved inference, not browser UI,
live processing, generated plants, or a claim that the agricultural model ships.
"""
from concurrent.futures import ThreadPoolExecutor,as_completed
import hashlib,json,math,shutil,subprocess,wave
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
import render_demo_video as base

ROOT=Path(__file__).resolve().parent;OUT=ROOT/'video';GFX=OUT/'graphics-r4';SHOTS=OUT/'shots-r4';EV=ROOT/'evidence/agricultural'
W,H,FPS=1920,1080,30
BG=base.BG;WHITE=base.WHITE;SAGE=base.SAGE;MUTED=base.MUTED;LIME=base.LIME;CORAL=base.CORAL;AMBER=base.AMBER
COLORS={'weed':CORAL,'crop':SAGE,'uncertain':AMBER}
SOURCES=json.loads((EV/'sources.json').read_text());TRUTH=json.loads((EV/'truth.json').read_text());METRICS=json.loads((EV/'results/confirmation/metrics.json').read_text())
LOCAL=json.loads((EV/'local-run/recognition.json').read_text());DEDUP=json.loads((EV/'dedup-example.json').read_text())

def ease(v):v=max(0,min(1,v));return v*v*(3-2*v)
def tx(d,xy,value,size=30,fill=WHITE,bold=False,display=False):
    # Bundled Latin font subsets lack mathematical arrows/comparison symbols.
    # Use readable words / ASCII comparisons rather than missing-glyph boxes.
    value=value.replace('→','to').replace('≥','>=').replace('≤','<=')
    base.text(d,xy,value,size,fill,bold,display,spacing=9)
def box(d,rect,fill=base.PANEL,outline='#43543b',radius=16):d.rounded_rectangle(rect,radius=radius,fill=fill,outline=outline,width=2)
def scene_canvas(chapter,title,scope='LOCAL RESEARCH / NOT DEPLOYED'):
    im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
    base.brand(d);tx(d,(310,28),chapter+' / '+title,25,display=True)
    f=base.font(22,bold=True);d.text((W-56-d.textlength(scope,font=f),33),scope,font=f,fill=AMBER)
    d.line((48,88,1872,88),fill='#35432e',width=1)
    tx(d,(64,906),'Real public PhenoBench pixels / Weyler et al. 2024 / CC BY-SA 4.0',20,MUTED)
    return im
def photo(name):return Image.open(EV/'images'/name).convert('RGB')
def crop_for(b,aspect=1.,padding=2.6):
    x,y,w,h=b;ch=min(600,max(112,h*1024*padding,w*1024*padding/aspect));cw=ch*aspect
    l=max(0,min(1024-cw,(x+w/2)*1024-cw/2));t=max(0,min(1024-ch,(y+h/2)*1024-ch/2))
    return [l,t,l+cw,t+ch]
def draw_photo(rgb,region,size,plants=(),target=None):
    l,t,r,b=region;pw,ph=size
    im=rgb.crop(tuple(round(v)for v in region)).resize(size,Image.Resampling.NEAREST);d=ImageDraw.Draw(im)
    for p in plants:
        x,y,w,h=p['box'];a=(x*1024-l)*pw/(r-l);c=(y*1024-t)*ph/(b-t);e=((x+w)*1024-l)*pw/(r-l);f=((y+h)*1024-t)*ph/(b-t)
        if e<0 or f<0 or a>pw or c>ph:continue
        color=COLORS[p['label']];d.rectangle([a,c,e,f],outline=color,width=3)
        if pw/(r-l)>2:
            label=p['label'];ft=base.font(24,bold=True);xx=max(2,min(pw-150,a));yy=max(2,min(ph-35,c-33));width=d.textlength(label,font=ft)+14
            d.rectangle([xx,yy,xx+width,yy+32],fill=BG);d.text((xx+7,yy),label,font=ft,fill=color)
    if target is not None:
        x,y,w,h=target;cx=(x+w/2)*1024;cy=(y+h/2)*1024;xx=(cx-l)*pw/(r-l);yy=(cy-t)*ph/(b-t);rr=max(26,max(w*pw*1024/(r-l),h*ph*1024/(b-t))/2+12)
        d.ellipse([xx-rr,yy-rr,xx+rr,yy+rr],outline=WHITE,width=2)
    return im
def pred(variant,name):return json.loads((EV/f'predictions/{variant}/{name}.json').read_text())['plants']
def make_card(kind):
    if kind.startswith('hook'):
        c=SOURCES['small'];im=scene_canvas('01','A LABEL WORTH CHECKING');d=ImageDraw.Draw(im)
        stages={'hook-crop':('Crop?','Previous experimental pipeline',SAGE,'crop'),'hook-truth':('Weed.','Public reference annotation',CORAL,'weed'),'hook-new':('Check the\nevidence.','Local agricultural detector',LIME,'weed')}
        title,sub,color,label=stages[kind];tx(d,(84,203),'23 SOURCE PIXELS',26,SAGE,bold=True);tx(d,(78,272),title,91,color,display=True);tx(d,(84,557),sub,32,bold=True)
        tx(d,(84,642),'One selected example.\nSame photograph. Different judgments.',31,SAGE)
        tx(d,(84,823),'Source image, not GPS. Human review required.',23,MUTED)
        rgb=photo(c['image_id']);region=crop_for(c['box']);p={'box':c['box'],'label':label}
        if kind!='hook-truth':
            candidates=pred('previous_hybrid'if kind=='hook-crop'else'selected',c['image_id']);p=max(candidates,key=lambda p:iou(p['box'],c['box']))
        im.paste(draw_photo(rgb,region,(680,680),[p]),(1168,168));tx(d,(1168,865),'Selected public-data example',23,MUTED)
    elif kind in ['local-input','local-output','local-log']:
        name=LOCAL['image_id'];im=scene_canvas('06','LOCAL RGB INFERENCE');d=ImageDraw.Draw(im);rgb=photo(name)
        im.paste(draw_photo(rgb,[0,0,1024,1024],(720,720),LOCAL['plants']if kind!='local-input'else()),(64,154));tx(d,(64,878),name,22,MUTED)
        tx(d,(870,158),'ACTUAL LOCAL RUN',24,SAGE,bold=True);tx(d,(865,211),'RGB → instance boxes',53,display=True)
        if kind=='local-input':
            tx(d,(870,333),'Published PhenoBench YOLOv7',35,bold=True);tx(d,(870,402),'Pretrained by the authors.\nNo model training by GreenPoint.',31,SAGE)
            tx(d,(870,550),'Input: one 1024 × 1024 RGB frame',30);tx(d,(870,611),'No annotations enter inference.',30);tx(d,(870,737),'Separate from the online Meta flow.',29,AMBER)
        elif kind=='local-log':
            d.rectangle((40,112,1880,904),fill=BG)
            tx(d,(80,142),'The run is reproducible.',66,display=True)
            tx(d,(87,253),'EXTRACT FROM THE ACTUAL recognition.json',24,SAGE,bold=True)
            box(d,(82,308,1124,808))
            fields=[('image_id',LOCAL['image_id']),('api_calls',str(LOCAL['api_calls'])),('annotation_input',str(LOCAL['annotation_input']).lower()),('human_review_required',str(LOCAL['human_review_required']).lower()),('research_prototype',str(LOCAL['research_prototype']).lower()),('deployed',str(LOCAL['deployed']).lower())]
            for j,(key,value)in enumerate(fields):
                y=342+j*69;tx(d,(112,y),key,28,SAGE);tx(d,(510,y),value,28,AMBER if key in ['research_prototype','deployed']else WHITE,bold=True)
            for y,label,body,color in [(317,'ONLINE','Meta evidence\nHuman review / MCP',SAGE),(568,'LOCAL','Agricultural detector\nNot yet connected online',AMBER)]:
                box(d,(1200,y,1835,y+211));tx(d,(1233,y+25),label,29,color,bold=True);tx(d,(1233,y+87),body,32)
            tx(d,(87,854),'Actual saved output / input SHA '+LOCAL['source_sha256'][:24]+'…',23,MUTED)
        else:
            box(d,(850,326,1848,799));tx(d,(884,348),str(len(LOCAL['plants']))+' plant candidates',57,LIME,display=True)
            tx(d,(887,445),f"{sum(p['label']=='crop'for p in LOCAL['plants'])} crop / {sum(p['label']=='weed'for p in LOCAL['plants'])} weed",37)
            tx(d,(887,525),f"{LOCAL['cpu_inference_seconds']:.2f}s CPU forward pass",37,SAGE)
            tx(d,(887,597),'0 API calls / RGB input only',30,SAGE);tx(d,(887,659),'Human review: required',30,AMBER)
            tx(d,(887,727),'Source SHA: '+LOCAL['source_sha256'][:20]+'…',23,MUTED)
            tx(d,(870,834),'Saved real inference / editorial output reveal',23,MUTED)
    elif kind in ['case-locate','case-compare','case-truth']:
        c=SOURCES['recovery'];name=c['image_id'];rgb=photo(name);im=scene_canvas('07','LOCATE A MISSED WEED');d=ImageDraw.Draw(im)
        tx(d,(64,117),'51px / A selected localization recovery',37,display=True)
        if kind=='case-locate':
            im.paste(draw_photo(rgb,[0,0,1024,1024],(720,720),target=c['box']),(64,170));tx(d,(868,238),'Whole-frame context.',57,display=True)
            tx(d,(871,359),'The previous experimental hybrid\nhas no box match at IoU ≥ 0.5.',32,SAGE);tx(d,(871,533),'The agricultural detector\nrecovers this weed instance.',37,CORAL,bold=True)
            tx(d,(871,748),'Selected example / public annotation reference',25,MUTED)
        elif kind=='case-compare':
            region=crop_for(c['box'],4/3);old=pred('previous_hybrid',name);new=pred('selected',name)
            for x,label,plants in [(64,'Previous experimental hybrid',old),(1024,'Local agricultural detector',new)]:
                tx(d,(x,183),label,31,bold=True);im.paste(draw_photo(rgb,region,(824,618),plants),(x,236))
            tx(d,(64,866),'No matching weed box',25,AMBER);tx(d,(1024,866),'Weed instance recovered',25,CORAL)
        else:
            region=crop_for(c['box']);groups=[('Source pixels',[]),('Public annotation',TRUTH[name]['plants']),('Local detector',pred('selected',name))]
            for j,(label,plants)in enumerate(groups):
                x=64+j*620;tx(d,(x,205),label,31,bold=True);im.paste(draw_photo(rgb,region,(548,548),plants),(x,260))
            tx(d,(68,847),'Same crop. Same source pixels. Reference annotation shown separately.',28,SAGE)
    elif kind=='calibration':
        im=scene_canvas('08','A FROZEN COMPARISON');d=ImageDraw.Draw(im);tx(d,(83,157),'Choose settings first. Then evaluate.',64,display=True)
        for x,value,title,body in [(84,'20','Calibration images','Model + threshold selection'),(710,'40','Confirmation images','No threshold tuning'),(1336,'196','Annotated weeds','Every miss stays in the score')]:
            box(d,(x,302,x+500,758));tx(d,(x+35,337),value,126,LIME,display=True);tx(d,(x+38,527),title,34,bold=True);tx(d,(x+38,612),body,24,SAGE)
        tx(d,(90,828),'Official PhenoBench val / image-disjoint from calibration / box IoU ≥ 0.5',28,MUTED)
        tx(d,(90,868),'Same public agricultural domain; not independent-farm validation.',23,AMBER)
    elif kind=='metrics':
        im=scene_canvas('08','SAME 40 IMAGES');d=ImageDraw.Draw(im);tx(d,(82,141),'Better precision. Similar recall.',66,display=True)
        rows=[('Weed precision','76.1%','96.7%',LIME),('Weed recall','60.2%','60.7%',SAGE)]
        tx(d,(638,277),'Previous experimental hybrid',26,MUTED);tx(d,(1280,277),'Local whole-frame detector',26,MUTED)
        for y,(label,old,new,color)in zip([363,605],rows):
            tx(d,(86,y+26),label,39,bold=True);tx(d,(640,y),old,90,SAGE,display=True);tx(d,(1102,y+12),'→',70,MUTED);tx(d,(1280,y),new,98,color,display=True)
        tx(d,(87,829),'119 / 196 weeds recovered / 119 of 123 weed predictions matched',29,SAGE)
        tx(d,(87,873),'Model settings frozen before confirmation. No GreenPoint training.',23,MUTED)
    elif kind=='false-flags':
        im=scene_canvas('08','FEWER FALSE WEED FLAGS');d=ImageDraw.Draw(im);tx(d,(80,146),'37 → 4',126,LIME,display=True)
        tx(d,(86,314),'Unmatched weed predictions on the same 40 images',37,SAGE)
        tx(d,(86,453),'Previous hybrid',31,bold=True);d.rounded_rectangle((500,440,1720,526),radius=10,fill=CORAL);tx(d,(1760,447),'37',51,CORAL,display=True)
        tx(d,(86,626),'Local detector',31,bold=True);d.rounded_rectangle((500,613,632,699),radius=10,fill=LIME);tx(d,(675,620),'4',51,LIME,display=True)
        tx(d,(86,796),'Correct weed instances: 118 → 119',31,SAGE);tx(d,(86,867),'One-to-one box IoU ≥ 0.5 / complete confirmation cohort',24,MUTED)
    elif kind in ['dedup-pair','dedup-metrics']:
        im=scene_canvas('09','TILE CLEANUP ABLATION');d=ImageDraw.Draw(im)
        if kind=='dedup-pair':
            e=DEDUP;rgb=photo(e['image_id']);region=crop_for(e['retained']['box'],4/3,padding=2.3)
            tx(d,(66,125),'One weed. A full box and a contained fragment.',42,display=True)
            for x,title,plants in [(64,'Before cleanup',[e['retained'],e['removed']]),(1024,'After cleanup',[e['retained']])]:
                tx(d,(x,201),title,32,bold=True);im.paste(draw_photo(rgb,region,(824,618),plants),(x,251))
            tx(d,(64,879),'Selected real overlapping predictions / fragment overlap '+f"{e['ios']*100:.1f}%",23,MUTED)
        else:
            tx(d,(85,150),'87.2% → 92.5%',103,LIME,display=True);tx(d,(90,293),'Weed precision / fixed tile comparison',37,SAGE)
            for x,value,label in [(90,'63.3%','Weed recall after cleanup'),(1000,'18 → 10','False weed flags')]:
                box(d,(x,412,x+820,747));tx(d,(x+37,449),value,94,WHITE,display=True);tx(d,(x+40,624),label,31,SAGE)
            tx(d,(94,805),'NMS + boundary handling + containment suppression',29,SAGE);tx(d,(94,862),'Separate ablation. The primary selected whole-frame method uses no tile cleanup.',24,AMBER)
    elif kind=='limits':
        c=SOURCES['miss'];name=c['image_id'];rgb=photo(name);im=scene_canvas('10','KEEP THE FAILURES VISIBLE');d=ImageDraw.Draw(im);region=crop_for(c['box'])
        im.paste(draw_photo(rgb,region,(720,720),[p for p in TRUTH[name]['plants']if p['id']==c['gt_id']]),(64,166));tx(d,(64,879),'Public annotation / a remaining 24px miss',22,MUTED)
        tx(d,(869,180),'The smallest weeds\nremain difficult.',53,display=True)
        tx(d,(868,382),'19 / 70',105,AMBER,display=True);tx(d,(873,515),'≤32px weeds recovered',33,SAGE)
        tx(d,(873,603),'Previous hybrid: 26 / 70',31,SAGE);tx(d,(873,676),'A measured tradeoff, not solved recall.',29,AMBER)
        tx(d,(873,799),'Human review remains essential.',32,bold=True)
    elif kind=='scope':
        im=scene_canvas('10','CURRENT SCOPE');d=ImageDraw.Draw(im);tx(d,(87,153),'A prototype with explicit boundaries.',61,display=True)
        for y,title,body in [(318,'Public sugar-beet data','Independent farm and phone-camera trials are next.'),(493,'Source-image positions','No GPS, navigation or physical treatment.'),(668,'Movement identity unvalidated','Two moving clips returned zero Meta candidates.')]:
            tx(d,(92,y),title,39,bold=True);tx(d,(95,y+66),body,30,SAGE)
    elif kind in ['close-scope','close-brand']:
        im=scene_canvas('11','EVERY JUDGMENT HAS A FRAME','INDIE DEVELOPER / BUILD FOR YOUR WORLD');d=ImageDraw.Draw(im)
        if kind=='close-scope':
            tx(d,(88,162),'Inspectable evidence.\nTraceable decisions.',76,display=True)
            for y,label,body,color in [(426,'ONLINE','Meta perception / review / Muse → MCP',SAGE),(557,'LOCAL','Tested agricultural recognition prototype',AMBER)]:
                box(d,(90,y,1830,y+106));tx(d,(118,y+27),label,28,color,bold=True);tx(d,(350,y+22),body,36)
            tx(d,(96,744),'NEXT / connect the expert to the product, then farm trials',31,SAGE);tx(d,(96,838),'greenpoint-vert.vercel.app',32,LIME,bold=True)
        else:
            base.brand(d,(112,241),116);tx(d,(120,440),'Every judgment has a frame.',65,display=True)
            d.rounded_rectangle((124,566,1010,572),radius=3,fill=LIME);tx(d,(124,643),'greenpoint-vert.vercel.app',38,LIME,bold=True)
            tx(d,(124,757),'Online Meta review + local agricultural research',30,SAGE)
    else:raise ValueError(kind)
    path=GFX/(kind+'.png');im.save(path);return path

def iou(a,b):
    k=max(0,min(a[0]+a[2],b[0]+b[2])-max(a[0],b[0]))*max(0,min(a[1]+a[3],b[1]+b[3])-max(a[1],b[1]));return k/(a[2]*a[3]+b[2]*b[3]-k)if k else 0.

def plan():
    shots=[]
    def card(start,end,kind,motion=None):shots.append({'start':start,'end':end,'kind':'card','card':kind,'motion':motion})
    def clip(start,end,source,at,crop,title,chapter,take=None):shots.append({'start':start,'end':end,'kind':'product','source':str(source),'at':at,'take':take or end-start,'crop':crop,'chapter':chapter,'title':title,'provenance':'Recorded Meta / actual online UI'if start<61 else'Separate real Muse trace / software only','mode':'normal','zoom':0.})
    def editorial(start,end,kind,title):shots.append({'start':start,'end':end,'kind':'editorial','mode':kind,'title':title})
    card(0,3,'hook-crop');card(3,6,'hook-truth');card(6,10,'hook-new')
    clip(10,16,base.MAIN,7,[250,90,1670,940],'REAL META OUTPUT. REVIEWABLE EVIDENCE.','02')
    editorial(16,24,'roles','SAM + MUSE + HUMAN REVIEW')
    clip(24,37,base.MAIN,61.9,[320,180,1600,900],'GP-001 / SAME SOURCE PIXELS','03',12)
    clip(37,40,base.MAIN,74,[1320,620,600,338],'INSPECT THE MODEL SUGGESTION','03')
    clip(40,44,base.PICK,18.8,[1320,550,600,338],'KEEP FOR REVIEW / SAVE','03')
    clip(44,48,base.PICK,28,[1300,600,620,349],'MODEL LABEL + HUMAN STATUS','03',1)
    clip(48,52,base.MAIN,112.5,[0,0,1920,1080],'THE SAME SESSION / VIDEO INVENTORY','04')
    clip(52,55,base.PICK,77.8,[310,180,1600,900],'EXPORT THE ACTUAL RECORD','04')
    editorial(55,61,'csv','ACTUAL CSV EXPORT')
    clip(61,66,base.MAIN,158.6,[220,150,1500,844],'MUSE DISCOVERS THE TOOLS','05',3)
    clip(66,71,base.MAIN,162.8,[220,150,1500,844],'REQUEST FRAME PERCEPTION','05',2.9)
    editorial(71,74,'trace-perceive','ACTUAL PERCEPTION RESPONSE');editorial(74,78,'trace-decision','EVIDENCE IDS / HUMAN REVIEW')
    clip(78,82,base.MAIN,166.7,[220,150,1500,844],'A BOUNDED NEXT STEP','05',2)
    card(82,87,'local-input');card(87,94,'local-output');card(94,100,'local-log')
    card(100,105,'case-locate','locate');card(105,113,'case-compare');card(113,117,'case-truth')
    card(117,122,'calibration');card(122,130,'metrics');card(130,137,'false-flags','flags')
    card(137,145,'dedup-pair');card(145,151,'dedup-metrics');card(151,158,'limits');card(158,167,'scope')
    card(167,176,'close-scope');card(176,180,'close-brand')
    assert shots[0]['start']==0 and shots[-1]['end']==180 and all(a['end']==b['start']for a,b in zip(shots,shots[1:]))
    (OUT/'edit-plan.json').write_text(json.dumps(shots,indent=2)+'\n');return shots

def render_card(index,shot):
    path=make_card(shot['card']);frames=round((shot['end']-shot['start'])*FPS)
    fingerprint=hashlib.sha256((json.dumps(shot,sort_keys=True)+hashlib.sha256(path.read_bytes()).hexdigest()+'r4-motion-v1').encode()).hexdigest()[:12];target=SHOTS/f'{index:02d}-{fingerprint}.mp4'
    if target.exists():return index,target
    common=['ffmpeg','-v','error','-y']
    if not shot.get('motion'):
        base.command(common+['-loop','1','-framerate','30','-i',str(path),'-an','-frames:v',str(frames),'-r','30','-c:v','libx264','-preset','veryfast','-crf','17','-threads','3','-pix_fmt','yuv420p','-video_track_timescale','15360',str(target)]);return index,target
    canvas=Image.open(path).convert('RGB')
    if shot['motion']=='locate':
        c=SOURCES['recovery'];rgb=photo(c['image_id']);destination=crop_for(c['box']);origin=[0.,0.,1024.,1024.]
    process=subprocess.Popen(common+['-f','rawvideo','-pix_fmt','rgb24','-s','1920x1080','-r','30','-i','pipe:0','-an','-frames:v',str(frames),'-c:v','libx264','-preset','veryfast','-crf','17','-threads','3','-pix_fmt','yuv420p','-video_track_timescale','15360',str(target)],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for frame in range(frames):
            t=frame/FPS;im=canvas.copy();d=ImageDraw.Draw(im)
            if shot['motion']=='locate':
                # Two eased camera stages retain source context; labels stay fixed.
                z=ease((t-.55)/3.45);z=.5*ease(z*2)if z<.5 else .5+.5*ease((z-.5)*2)
                region=[a+(b-a)*z for a,b in zip(origin,destination)];im.paste(draw_photo(rgb,region,(720,720),target=c['box']),(64,170))
            elif shot['motion']=='flags':
                f=ease((t-.3)/1.2);f=.5*ease(f*2)if f<.5 else .5+.5*ease((f-.5)*2)
                d.rectangle((497,438,1724,529),fill=BG);d.rectangle((497,610,636,702),fill=BG)
                if f>0:d.rounded_rectangle((500,440,500+1220*f,526),radius=10,fill=CORAL);d.rounded_rectangle((500,613,500+132*f,699),radius=10,fill=LIME)
            # Quiet brand accent gives motion a stable hierarchy.
            d.line((49,87,49+round(115+8*math.sin(t*math.pi)),87),fill=LIME,width=2)
            process.stdin.write(im.tobytes())
        process.stdin.close();error=process.stderr.read().decode();code=process.wait()
        if code:raise RuntimeError(error)
    except Exception:process.kill();raise
    return index,target

def render(index,shot):
    if shot['kind']=='card':return render_card(index,shot)
    if shot['kind']=='editorial':
        png=base.template(shot['mode']);return render_card(index,{'start':shot['start'],'end':shot['end'],'kind':'card','card':'external:'+str(png),'motion':None})
    return base.render_shot(index,shot)

_make_card=make_card
def make_card(kind):
    if kind.startswith('external:'):return Path(kind.split(':',1)[1])
    return _make_card(kind)

def soundtrack():
    target=OUT/'soundtrack-r4.wav'
    with wave.open(str(ROOT/'audio/greenpoint-narration-180s.wav'))as f:rate=f.getframerate();voice=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(np.float32)/32768
    bed=np.zeros(len(voice),dtype=np.float32)
    for start,end,notes in [(0,61,[110,164.81,220]),(61,100,[130.81,196,261.63]),(100,151,[146.83,220,293.66]),(151,180,[110,164.81,220])]:
        a,b=round(start*rate),round(end*rate);t=np.arange(b-a,dtype=np.float32)/rate;envelope=np.minimum(1,t/3)*np.minimum(1,(end-start-t)/3)
        for freq in notes:bed[a:b]+=np.sin(2*np.pi*freq*t)*envelope*.0008
    rms=np.sqrt(np.mean(voice.reshape(-1,480)**2,axis=1));bed*=np.repeat(np.where(rms>.007,.35,.7),480)
    for when in [40.6,42.5,52.6,66.5]:
        a=round(when*rate);t=np.arange(round(.06*rate),dtype=np.float32)/rate;click=np.sin(2*np.pi*740*t)*.004*np.exp(-t*85);bed[a:a+len(t)]+=click
    mixed=np.clip(voice+bed,-.98,.98)
    with wave.open(str(target),'wb')as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mixed*32767).astype('<i2').tobytes())
    return target

def main():
    for p in [OUT,GFX,SHOTS]:p.mkdir(exist_ok=True)
    base.OUT=OUT;base.GFX=GFX;base.SHOTS=SHOTS;base.init_fonts()
    shots=plan();results={};print(f'Rendering {len(shots)} distinct evidence/product shots.',flush=True)
    with ThreadPoolExecutor(max_workers=2)as pool:
        pending={pool.submit(render,i,s):i for i,s in enumerate(shots)}
        for future in as_completed(pending):
            index,path=future.result();results[index]=path;print(f'Rendered {index+1}/{len(shots)} / {shots[index]["start"]}–{shots[index]["end"]}s',flush=True)
    concat=OUT/'shots-r4.ffconcat';concat.write_text('\n'.join("file '"+str(results[i])+"'"for i in range(len(shots)))+'\n')
    silent=OUT/'picture-master-r4.mp4';base.command(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(concat),'-an','-c:v','copy','-movflags','+faststart',str(silent)])
    captions=base.render_caption_track();sound=soundtrack();final=OUT/'GreenPoint-Hackathon-Demo-3min-r4.mp4'
    print('Compositing aligned Bella narration and burned English captions.',flush=True)
    base.command(['ffmpeg','-v','error','-y','-filter_complex_threads','2','-i',str(silent),'-i',str(captions),'-i',str(sound),'-filter_complex','[0:v][1:v]overlay=0:936:shortest=1,format=yuv420p[v]','-map','[v]','-map','2:a:0','-c:v','libx264','-preset','fast','-crf','18','-threads','8','-c:a','aac','-b:a','192k','-metadata','title=GreenPoint | Every judgment has a frame | Recognition evidence revision','-metadata:s:a:0','language=eng','-r','30','-t','180','-movflags','+faststart',str(final)])
    for alias in ['GreenPoint-Hackathon-Demo-3min-final.mp4','GreenPoint-Hackathon-Demo-3min.mp4']:shutil.copy2(final,OUT/alias)
    for name in ['GreenPoint-Hackathon-Demo-en.srt','GreenPoint-Hackathon-Demo-final-en.srt']:shutil.copy2(ROOT/'audio/greenpoint-narration.srt',OUT/name)
    base.command(['ffmpeg','-v','error','-y','-ss','7','-i',str(final),'-frames:v','1','-q:v','2',str(OUT/'GreenPoint-Hackathon-Demo-poster.jpg')])
    info=json.loads(base.command(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(final)]))
    manifest={'revision':'r4-agricultural-evidence','duration_seconds':180,'voice':'ElevenLabs Bella / American female','narration_method':'All 11 r4 passages newly synthesized; original provider character timestamps; no duplicate subtitle track','burned_in_subtitle_cues':len(base.read_captions()),'source_recordings':[str(base.MAIN),str(base.PICK)],'research_evidence':'Actual local CPU output and frozen 40-image PhenoBench confirmation; editorial photographic panels, not deployed UI','research_disclosure':'Local research prototype / not deployed','selected_model':'Official pretrained PhenoBench YOLOv7; no GreenPoint training','paired_precision':[76.129,96.748],'paired_recall':[60.204,60.714],'small_target_regression_disclosed':True,'theme':'Build for Your World','shots':len(shots),'probe':info}
    (OUT/'render-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(f'Complete: {final} / {final.stat().st_size/1e6:.1f} MB',flush=True)
if __name__=='__main__':main()
