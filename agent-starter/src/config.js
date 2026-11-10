import path from 'node:path';
import { readFileSync } from 'node:fs';
try { for (const line of readFileSync(path.resolve('.env'),'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)) { const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if(m&&process.env[m[1]]===undefined) process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,''); } } catch(e) { if(e.code!=='ENOENT') throw e; }
const did=process.env.FLOP_AGENT_DID??'did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h';
if(!did.startsWith('did:key:')) throw new Error('FLOP_AGENT_DID must be a public did:key identifier.');
export const config=Object.freeze({name:process.env.AGENT_NAME??'FLOP Local Agent',did,storageDir:path.resolve(process.env.AGENT_STORAGE??'./data'),network:process.env.FLOP_NETWORK??'disabled',openaiApiKey:process.env.OPENAI_API_KEY??'',openaiModel:process.env.OPENAI_MODEL??'gpt-6-astra'});
