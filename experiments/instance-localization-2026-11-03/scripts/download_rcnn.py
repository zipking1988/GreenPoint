"""Bounded official Faster R-CNN agricultural checkpoint download, no execution."""
import concurrent.futures,hashlib,json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
URL='https://www.ipb.uni-bonn.de/html/projects/phenobench/rcnn/plant_detection/last.pt'
TOTAL=494_439_552
target=ROOT/'weights/fasterrcnn.pt';parts=ROOT/'weights/faster-download-parts';parts.mkdir(parents=True,exist_ok=True)
if not target.exists():
    def fetch(start):
        end=min(TOTAL-1,start+7_999_999);p=parts/f'{start}.part'
        if p.exists():value=p.read_bytes()
        else:
            req=urllib.request.Request(URL,headers={'Range':f'bytes={start}-{end}'})
            with urllib.request.urlopen(req,timeout=90) as r:
                assert r.status==206 and r.headers.get('Content-Range','').startswith(f'bytes {start}-{end}/')
                value=r.read(end-start+2)
            assert len(value)==end-start+1;p.write_bytes(value)
        assert len(value)==end-start+1
        print(f'Verified Faster R-CNN range {start}-{end}',flush=True)
        return p
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        files=list(pool.map(fetch,range(0,TOTAL,8_000_000)))
    with target.open('wb') as output:
        for p in files:output.write(p.read_bytes())
assert target.stat().st_size==TOTAL
value={'url':URL,'bytes':TOTAL,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'official_baselines_commit':'78db625441e54c5b64efabeb0d886d020961665b','model':'torchvision Faster R-CNN ResNet50 FPN, three classes','trained_by_greenpoint':False}
(ROOT/'fasterrcnn-provenance.json').write_text(json.dumps(value,indent=2)+'\n');print(json.dumps(value),flush=True)
