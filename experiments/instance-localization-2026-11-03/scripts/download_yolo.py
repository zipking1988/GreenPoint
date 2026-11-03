"""Bounded official agricultural checkpoint download; no deserialization."""
import concurrent.futures,hashlib,json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
url='https://www.ipb.uni-bonn.de/html/projects/phenobench/plant_detection/YOLOv7/yolov7_plant_detection.pt'
path=ROOT/'weights/yolov7_plant_detection.pt';path.parent.mkdir(parents=True,exist_ok=True)
if path.exists():value=path.read_bytes()
else:
    parts=ROOT/'weights/download-parts';parts.mkdir(exist_ok=True)
    total=74_940_809;chunk=6_000_000
    def fetch(start):
        end=min(total-1,start+chunk-1);p=parts/f'{start}.part'
        if p.exists():b=p.read_bytes()
        else:
            request=urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}'})
            with urllib.request.urlopen(request,timeout=90) as r:
                assert r.status==206 and r.headers.get('Content-Range','').startswith(f'bytes {start}-{end}/')
                b=r.read(end-start+2)
            assert len(b)==end-start+1;p.write_bytes(b)
        assert len(b)==end-start+1
        print(f'Verified checkpoint range {start}-{end}',flush=True)
        return b
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:value=b''.join(pool.map(fetch,range(0,total,chunk)))
    assert len(value)==74_940_809
    path.write_bytes(value)
assert len(value)==74_940_809
meta={'url':url,'bytes':len(value),'sha256':hashlib.sha256(value).hexdigest(),'official_baselines_commit':'78db625441e54c5b64efabeb0d886d020961665b','yolov7_submodule_commit':'84932d70fb9e2932d0a70e4a1f02a1d6dd1dd6ca','trained_by_greenpoint':False}
(ROOT/'weights-provenance.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta),flush=True)
