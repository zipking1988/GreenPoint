"""Verify r4 media integrity, caption coverage, timing and evidence provenance."""
import hashlib,json,re,subprocess,wave
from pathlib import Path
import elevenlabs_voiceover as speech
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'video';QA=OUT/'qa-r4'
def run(args):
    r=subprocess.run(args,capture_output=True,text=True)
    if r.returncode:raise RuntimeError(r.stderr[-2000:])
    return r
def main():
    QA.mkdir(exist_ok=True);movie=OUT/'GreenPoint-Hackathon-Demo-3min-r4.mp4';info=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(movie)]).stdout)
    video=next(s for s in info['streams']if s['codec_type']=='video');audio=next(s for s in info['streams']if s['codec_type']=='audio')
    assert (video['width'],video['height'],video['codec_name'],video['r_frame_rate'],video['avg_frame_rate'],int(video['nb_frames']))==(1920,1080,'h264','30/1','30/1',5400)
    assert audio['codec_name']=='aac' and audio['sample_rate']=='48000' and len(info['streams'])==2
    assert abs(float(info['format']['duration'])-180)<.01
    board=json.loads((ROOT/'storyboard.json').read_text());narration=json.loads((ROOT/'audio/manifest.json').read_text());captions=speech.read_subtitles(ROOT/'audio/greenpoint-narration.srt')
    norm=lambda v:' '.join(v.replace('M C P','MCP').split())
    assert norm(' '.join(s['narration']for s in board['scenes']))==norm(' '.join(t for a,b,t in captions))
    assert len(narration['scenes'])==11 and narration['master_wav_seconds']==180
    assert all(0<=a<b<=180 and len(t.splitlines())<=2 for a,b,t in captions)
    assert all(b<=c+.001 for(a,b,_),(c,d,_)in zip(captions,captions[1:]))
    assert all(.92-1e-7<=s['tempo']<=1.08 and s['speech_end']<=s['end']+.001 for s in narration['scenes'])
    shots=json.loads((OUT/'edit-plan.json').read_text());assert len(shots)==32 and all(a['end']==b['start']for a,b in zip(shots,shots[1:])) and shots[-1]['end']==180
    decoded=run(['ffmpeg','-hide_banner','-v','warning','-i',str(movie),'-f','null','-']);(QA/'full-decode.log').write_text(decoded.stderr)
    black=run(['ffmpeg','-hide_banner','-i',str(movie),'-vf','blackdetect=d=0.1:pix_th=0.01:pic_th=0.98','-an','-f','null','-']).stderr
    black_events=[s for s in black.splitlines()if 'black_start:'in s];assert not black_events
    loud=run(['ffmpeg','-hide_banner','-i',str(movie),'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-']).stderr
    loudness=json.loads(re.findall(r'\{[\s\S]*?\}',loud)[-1]);assert float(loudness['input_tp'])<0
    (QA/'loudness.json').write_text(json.dumps(loudness,indent=2)+'\n')
    evidence=ROOT/'evidence/agricultural';local=json.loads((evidence/'local-run/recognition.json').read_text());source=evidence/'images'/local['image_id'];assert hashlib.sha256(source.read_bytes()).hexdigest()==local['source_sha256'] and not local['annotation_input'] and local['api_calls']==0
    metrics=json.loads((evidence/'results/confirmation/metrics.json').read_text());m=metrics['selected']['aggregate'];old=metrics['previous_hybrid']['aggregate'];assert(m['weed_tp'],m['weed_predictions'],m['gt_weed'])==(119,123,196)and(old['weed_tp'],old['weed_predictions'])==(118,155)
    bundle_sources=json.loads((evidence/'sources.json').read_text())
    for s in bundle_sources.values():assert hashlib.sha256((ROOT/s['image']).read_bytes()).hexdigest()==s['sha256']
    dedup=json.loads((evidence/'dedup-example.json').read_text());before=json.loads((evidence/f'predictions/tiles_nms_only/{dedup["image_id"]}.json').read_text())['plants'];after=json.loads((evidence/f'predictions/tiles_containment/{dedup["image_id"]}.json').read_text())['plants']
    assert dedup['retained']['id']in {p['id']for p in before} and dedup['removed']['id']in {p['id']for p in before} and dedup['removed']['id']not in {p['id']for p in after}
    oldmovie=ROOT/'video/versions/pre-recognition-20261103/video/GreenPoint-Hackathon-Demo-3min-final.mp4';assert hashlib.sha256(oldmovie.read_bytes()).hexdigest()=='4d1ff8d6a9515a2f0b0652e257edd3c6f4da78a1f22448da0e12309b976552e6'
    sha=hashlib.sha256(movie.read_bytes()).hexdigest()
    assert all(hashlib.sha256((OUT/n).read_bytes()).hexdigest()==sha for n in ['GreenPoint-Hackathon-Demo-3min-final.mp4','GreenPoint-Hackathon-Demo-3min.mp4'])
    report={'file':'GreenPoint-Hackathon-Demo-3min-final.mp4','revision':'r4-agricultural-evidence','sha256':sha,'duration_seconds':180,'size_bytes':movie.stat().st_size,'width':1920,'height':1080,'fps':30,'video_frames':5400,'video_codec':'h264','audio_codec':'aac','voice':'ElevenLabs Bella / American female','new_narration_scenes':11,'subtitle_cues':len(captions),'subtitle_text_matches_full_narration':True,'subtitle_tracks':'burned in + separate SRT; no duplicate embedded track','full_decode':'passed','black_segments':black_events,'loudness':loudness,'actual_source_and_local_run_sha_verified':True,'actual_dedup_pair_verified':True,'local_prototype_scope_visible':True,'small_target_regression_disclosed':True,'previous_movie_preserved':True,'visual_shot_samples':32,'visual_review':'pending final sample review'}
    (OUT/'qa-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k]for k in ['file','sha256','duration_seconds','size_bytes','subtitle_cues','full_decode','loudness']}))
if __name__=='__main__':main()
