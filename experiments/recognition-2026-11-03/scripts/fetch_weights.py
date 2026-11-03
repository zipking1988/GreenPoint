"""Download only the official, hash-pinned research checkpoint."""
import hashlib
import urllib.request
from pathlib import Path

root=Path(__file__).resolve().parents[1]
target=root/'weights/erfnet.ckpt'
expected='06252edf0e4d75a288d5f2d45bd386393e117454787dad93c5cdaa65e2c66fe2'
if target.exists():
    assert hashlib.sha256(target.read_bytes()).hexdigest()==expected
    print('Verified cached official ERFNet weights.')
else:
    url='https://www.ipb.uni-bonn.de/html/projects/phenobench/semantic_segmentation/semantic-seg-erfnet.ckpt'
    with urllib.request.urlopen(url,timeout=90) as response:
        value=response.read(26_000_001)
    assert len(value)==25_076_659 and hashlib.sha256(value).hexdigest()==expected
    target.parent.mkdir(exist_ok=True)
    target.write_bytes(value)
    print('Downloaded and verified official ERFNet weights; no code unpickling performed by this command.')
