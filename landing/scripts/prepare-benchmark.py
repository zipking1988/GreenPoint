"""Convert independent annotations to evaluation metadata, never model input."""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(sys.argv[1] if len(sys.argv) > 1 else '../reviews/hackathon-sprint-2026-11-03')
manifest = json.loads((root / 'manifest.json').read_text())
truth = {}
for item in manifest['items']:
    semantics = np.asarray(Image.open(root / item['files']['semantics']['path']))
    instances = np.asarray(Image.open(root / item['files']['plant_instances']['path']))
    plants = []
    for identity in np.unique(instances):
        if not identity: continue
        selected = instances == identity
        counts = np.bincount(semantics[selected].astype(int), minlength=5)
        label = int(np.argmax(counts[1:]) + 1)
        if label not in [1, 2, 3, 4]: continue
        ys, xs = np.where(selected)
        plants.append({'id': int(identity), 'label': 'crop' if label in [1, 3] else 'weed', 'partial': label in [3, 4], 'pixels': int(selected.sum()), 'box': [float(xs.min() / semantics.shape[1]), float(ys.min() / semantics.shape[0]), float((xs.max() - xs.min() + 1) / semantics.shape[1]), float((ys.max() - ys.min() + 1) / semantics.shape[0])]})
    truth[item['id']] = {'width': semantics.shape[1], 'height': semantics.shape[0], 'plants': plants}
(root / 'truth.json').write_text(json.dumps(truth, indent=2) + '\n')
first = next(item for item in manifest['items'] if item['purpose'] == 'development')
crop = max((p for p in truth[first['id']]['plants'] if p['label'] == 'crop' and not p['partial']), key=lambda p: p['pixels'])
(root / 'reference.json').write_text(json.dumps({'source_id': first['id'], 'purpose': 'development-only known crop reference; evaluation labels are never input', 'box': crop['box']}, indent=2) + '\n')
print(f'Prepared independent object references for {len(truth)} images. Crop anchor: {first["id"]}')
