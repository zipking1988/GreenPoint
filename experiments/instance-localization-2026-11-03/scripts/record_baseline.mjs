import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
for(const args of [
 ['scripts/run_previous.mjs','--phase','confirmation','--geometry','whole','--live'],
 ['scripts/run_previous.mjs','--phase','confirmation','--geometry','tiles640','--live'],
 ['scripts/prepare_masks.mjs','--phase','confirmation','--geometry','whole'],
 ['scripts/prepare_masks.mjs','--phase','confirmation','--geometry','tiles640'],
]){
 const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:process.env});
 if(result.status!==0)process.exit(result.status||1);
}
