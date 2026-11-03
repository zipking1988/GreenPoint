"""Fetch a new, image-disjoint public confirmation set before further inference."""

import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.phenobench.org/data/PhenoBench-v110.zip"
SEED = "recognition-v2-20261103"


class RemoteZip(io.RawIOBase):
    def __init__(self):
        self.pos, self.transferred = 0, 0
        with urllib.request.urlopen(urllib.request.Request(URL, method="HEAD"), timeout=60) as r:
            self.size = int(r.headers["Content-Length"])

    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.pos

    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else self.size + offset
        if self.pos < 0: raise ValueError("Negative archive seek")
        return self.pos

    def read(self, count=-1):
        count = min(self.size - self.pos, count if count >= 0 else self.size - self.pos)
        if count <= 0: return b""
        if count > 8_000_000 or self.transferred + count > 200_000_000:
            raise RuntimeError("Range extraction budget exceeded; never download the full archive.")
        request = urllib.request.Request(URL, headers={"Range": f"bytes={self.pos}-{self.pos+count-1}"})
        with urllib.request.urlopen(request, timeout=90) as r:
            if r.status != 206: raise RuntimeError("The server did not honor the selected-member request.")
            value = r.read(count)
        self.pos += len(value)
        self.transferred += len(value)
        return value


def digest(data): return hashlib.sha256(data).hexdigest()


def main():
    target = ROOT / "confirmatory"
    target.mkdir(exist_ok=True)
    finished = target / "manifest.json"
    if finished.exists():
        manifest = json.loads(finished.read_text())
        for item in manifest["items"]:
            for meta in item["files"].values():
                assert digest((ROOT / meta["path"]).read_bytes()) == meta["sha256"]
        print("Reusing the verified, frozen confirmation set.", flush=True)
        return
    old = json.loads((ROOT / "baseline/manifest.json").read_text())
    excluded = {i["id"] for i in old["items"]} | {"05-15_00028_P0030852.png"}
    remote = RemoteZip()
    with zipfile.ZipFile(remote) as archive:
        names = set(archive.namelist())
        images = [n for n in names if "/val/images/" in "/" + n and n.endswith(".png") and Path(n).name not in excluded]
        images.sort(key=lambda n: digest((SEED + ":" + Path(n).name).encode()))
        chosen = images[:20]
        assert len(chosen) == 20
        selection = {"seed": SEED, "source": URL, "selection": "SHA256(seed:filename); official val, all previous images excluded", "ids": [Path(n).name for n in chosen], "frozen_before_new_inference": True, "scope": "Image-disjoint confirmation set; same public agricultural domain, not independent Japanese farms."}
        selection_path = target / "selection.json"
        if selection_path.exists():
            assert json.loads(selection_path.read_text()) == selection
        else:
            selection_path.write_text(json.dumps(selection, indent=2) + "\n")
        manifest = {**selection, "items": []}
        for name in chosen:
            item = {"id": Path(name).name, "split": "val", "purpose": "confirmatory", "files": {}}
            for field in ("images", "semantics", "plant_instances"):
                member = name.replace("/images/", f"/{field}/")
                assert member in names
                destination = ROOT / "data/confirmatory" / field / Path(name).name
                destination.parent.mkdir(parents=True, exist_ok=True)
                data = destination.read_bytes() if destination.exists() else archive.read(member)
                assert len(data) == archive.getinfo(member).file_size
                if not destination.exists(): destination.write_bytes(data)
                item["files"][field] = {"path": str(destination.relative_to(ROOT)), "sha256": digest(data), "bytes": len(data)}
            manifest["items"].append(item)
            print("Frozen confirmation image:", item["id"], flush=True)
        manifest["range_bytes_transferred"] = remote.transferred
        finished.write_text(json.dumps(manifest, indent=2) + "\n")
        print("All 20 new confirmation images and separate annotations frozen.", flush=True)


if __name__ == "__main__": main()
