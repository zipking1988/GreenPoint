import subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
for model in ['erfnet','yolo','faster']:
    subprocess.run([sys.executable,'-u','scripts/infer.py','--phase','confirmation','--model',model,'--geometry','multiscale'],cwd=root,check=True)
subprocess.run([sys.executable,'scripts/score.py'],cwd=root,check=True)
