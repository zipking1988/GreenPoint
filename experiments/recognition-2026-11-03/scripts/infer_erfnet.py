"""RGB-only inference with official pretrained PhenoBench weights; no training."""
import argparse
import hashlib
import importlib.util
import json
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--phase', choices=['development', 'evaluation', 'confirmatory'], required=True)
args = parser.parse_args()
manifest = json.loads((ROOT / ('confirmatory/manifest.json' if args.phase == 'confirmatory' else 'baseline/manifest.json')).read_text())
items = [i for i in manifest['items'] if i['purpose'] == args.phase]
checkpoint = ROOT / 'weights/erfnet.ckpt'
sha = hashlib.sha256(checkpoint.read_bytes()).hexdigest()
assert sha == '06252edf0e4d75a288d5f2d45bd386393e117454787dad93c5cdaa65e2c66fe2'
spec = importlib.util.spec_from_file_location('official_erfnet', ROOT / 'vendor/erfnet.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
torch.set_num_threads(4)
model = module.ERFNetModel(num_classes=3, pretrained=False)
weights = torch.load(checkpoint, map_location='cpu', weights_only=True)
state = {k.removeprefix('network.'): v for k, v in weights['state_dict'].items() if k.startswith('network.')}
model.load_state_dict(state, strict=True)
model.eval()
destination = ROOT / 'probabilities' / args.phase
destination.mkdir(parents=True, exist_ok=True)
for item in items:
    output = destination / (item['id'] + '.npz')
    if output.exists():
        print(json.dumps({'image': item['id'], 'cached': True}), flush=True)
        continue
    source = ROOT / item['files']['images']['path']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == item['files']['images']['sha256']
    rgb = np.array(Image.open(source).convert('RGB'))
    x = torch.from_numpy(rgb.copy()).permute(2, 0, 1).float() / 255
    x = (x - x.mean((1, 2), keepdim=True)) / (x.std((1, 2), keepdim=True) + 1e-17)
    with torch.inference_mode():
        start = time.perf_counter()
        probabilities = model(x.unsqueeze(0)).softmax(dim=1)[0].cpu().numpy()
        elapsed = time.perf_counter() - start
    labels = probabilities.argmax(axis=0).astype(np.uint8)
    np.savez_compressed(output, probabilities=probabilities.astype(np.float16), labels=labels)
    metadata = {'image_id': item['id'], 'model': 'Official pretrained PhenoBench ERFNet', 'weights_sha256': sha,
                'source_sha256': item['files']['images']['sha256'], 'torch_version': torch.__version__,
                'device': 'cpu', 'threads': 4, 'inference_seconds': elapsed, 'annotation_input': False,
                'trained_by_greenpoint': False, 'normalization': 'per-image channel mean and sample std',
                'probability_storage': 'float16; hard labels from original float32 logits'}
    output.with_suffix('.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(json.dumps({'image': item['id'], 'seconds': round(elapsed, 3)}), flush=True)
