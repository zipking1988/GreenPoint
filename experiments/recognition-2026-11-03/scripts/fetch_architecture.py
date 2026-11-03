"""Fetch the optional, separately licensed ERFNet baseline dependency.

Review the upstream noncommercial license before running. The file is not part
of GreenPoint's MIT source distribution; only the original research run used it.
"""
import hashlib
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "78db625441e54c5b64efabeb0d886d020961665b"
URL = (f"https://raw.githubusercontent.com/PRBonn/phenobench-baselines/{COMMIT}/"
       "semantic_segmentation/modules/erfnet/erfnet_modified.py")
LICENSE_URL = "https://github.com/Eromera/erfnet_pytorch/blob/master/license.txt"
UPSTREAM_SHA = "6b66058a66b022d01dddef9ea5f84a6946c421ec18699b9746ab9a25306fb5ea"
LOCAL_SHA = "cc54f1402aab2cc2b8eca07d50d489b74d179f8fc3913cae22430e2a86191dea"
TARGET = ROOT / "vendor/erfnet.py"

if TARGET.exists():
    assert hashlib.sha256(TARGET.read_bytes()).hexdigest() == LOCAL_SHA
    print("Verified the previously obtained, separately licensed architecture.")
else:
    print(f"Optional ERFNet dependency: CC BY-NC 4.0. Original terms: {LICENSE_URL}")
    with urllib.request.urlopen(URL, timeout=30) as response:
        raw = response.read(100_001)
    assert hashlib.sha256(raw).hexdigest() == UPSTREAM_SHA
    header = ("# Architecture from PRBonn/phenobench-baselines, erfnet_modified.py.\n"
              "# Local research smoke test only. The unused wget import was removed; pretrained=False avoids downloads at execution.\n")
    adapted = (header + raw.decode("utf-8").replace("import wget\n", "")).encode("utf-8")
    assert hashlib.sha256(adapted).hexdigest() == LOCAL_SHA
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_bytes(adapted)
    print("Downloaded and verified the exact architecture used in the recorded baseline.")
