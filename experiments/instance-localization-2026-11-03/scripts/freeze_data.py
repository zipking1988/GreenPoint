"""Freeze 20 calibration / 40 confirmation val images, then bounded parallel ZIP ranges."""
import concurrent.futures,hashlib,json,struct,sys,urllib.request,zipfile,zlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PREVIOUS=ROOT.parent/'recognition-2026-11-03'
sys.path.insert(0,str(PREVIOUS/'scripts'))
from freeze_confirmatory import RemoteZip,URL
SEED='instance-localization-v2-20261103'
def digest(b):return hashlib.sha256(b).hexdigest()
def save(p,x):
    p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,indent=2)+'\n')
def main():
    excluded={'05-15_00028_P0030852.png'}
    for p in ['baseline/manifest.json','confirmatory/manifest.json']:
        excluded.update(i['id'] for i in json.loads((PREVIOUS/p).read_text())['items'])
    remote=RemoteZip()
    with zipfile.ZipFile(remote) as z:
        names=[n for n in z.namelist() if '/val/images/' in '/'+n and n.endswith('.png') and Path(n).name not in excluded]
        names.sort(key=lambda n:digest((SEED+':'+Path(n).name).encode()))
        selected=names[:60];assert len(selected)==60
        selection={'seed':SEED,'source':URL,'development':[Path(n).name for n in selected[:20]],'confirmation':[Path(n).name for n in selected[20:]],'excluded_previous_images':sorted(excluded),'frozen_before_model_inference':True,'image_disjoint_only':True}
        p=ROOT/'data-selection.json'
        if p.exists():assert json.loads(p.read_text())==selection
        else:save(p,selection)
        items=[];jobs=[]
        for j,name in enumerate(selected):
            phase='development' if j<20 else 'confirmation'
            item={'id':Path(name).name,'purpose':phase,'split':'val','files':{}};items.append(item)
            for kind in ['images','semantics','plant_instances']:
                member=name.replace('/images/',f'/{kind}/');info=z.getinfo(member)
                rel=f'data/{phase}/{kind}/{item["id"]}'
                item['files'][kind]={'path':rel,'bytes':info.file_size,'archive_crc32':info.CRC}
                jobs.append((item,kind,info))
    def fetch(job):
        item,kind,info=job;meta=item['files'][kind];p=ROOT/meta['path']
        if p.exists():value=p.read_bytes()
        else:
            count=info.compress_size+512
            assert count<8_000_000
            end=min(remote.size-1,info.header_offset+count-1)
            req=urllib.request.Request(URL,headers={'Range':f'bytes={info.header_offset}-{end}'})
            with urllib.request.urlopen(req,timeout=90)as r:
                assert r.status==206,'Range request was not honored'
                packed=r.read(count+1)
            assert packed[:4]==b'PK\x03\x04'
            filename_len,extra_len=struct.unpack_from('<HH',packed,26)
            start=30+filename_len+extra_len
            assert start<=512
            compressed=packed[start:start+info.compress_size];assert len(compressed)==info.compress_size
            value=zlib.decompress(compressed,-15) if info.compress_type==8 else compressed if info.compress_type==0 else None
            assert value is not None
            assert len(value)==meta['bytes'] and zlib.crc32(value)==meta['archive_crc32']
            p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(value)
        assert len(value)==meta['bytes'] and zlib.crc32(value)==meta['archive_crc32']
        meta['sha256']=digest(value)
        return item['id'],kind
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for index,done in enumerate(pool.map(fetch,jobs),1):
            if index%3==0:print('Verified',done[0],flush=True)
            if index==60:save(ROOT/'development-manifest.json',{'selection':selection,'items':items[:20]})
    save(ROOT/'manifest.json',{'selection':selection,'items':items})
    print('Frozen and verified all 60 new image/annotation triplets.',flush=True)
if __name__=='__main__':main()
