import path from 'node:path';
import { readFileSync } from 'node:fs';
try { for (const line of readFileSync(path.resolve('.env'),'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)) { const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if(m&&process.env[m[1]]===undefined) process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,''); } } catch(e) { if(e.code!=='ENOENT') throw e; }
const did=process.env.FLOP_AGENT_DID??'did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h';
if(!did.startsWith('did:key:')) throw new Error('FLOP_AGENT_DID must be a public did:key identifier.');
const aiProvider=(process.env.AI_PROVIDER??'ollama').toLowerCase();
if(!['ollama','openai'].includes(aiProvider))throw new Error('AI_PROVIDER must be "ollama" or "openai".');
export const config=Object.freeze({name:process.env.AGENT_NAME??'FLOP Local Agent',did,storageDir:path.resolve(process.env.AGENT_STORAGE??'./data'),network:process.env.FLOP_NETWORK??'disabled',aiProvider,ollamaBaseUrl:(process.env.OLLAMA_BASE_URL??'http://localhost:11434/v1').replace(/\/+$/,''),ollamaModel:process.env.OLLAMA_MODEL??'llama3.2:1b',openaiApiKey:process.env.OPENAI_API_KEY??'',openaiModel:process.env.OPENAI_MODEL??'gpt-6-astra'});
