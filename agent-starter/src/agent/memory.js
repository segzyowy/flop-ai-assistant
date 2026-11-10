import { mkdir, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
export function createMemory(dir){const file=path.join(dir,'memory.jsonl');return{async add(text){await mkdir(dir,{recursive:true});await appendFile(file,JSON.stringify({text,createdAt:new Date().toISOString()})+'\n','utf8');},async list(){try{return(await readFile(file,'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse);}catch(e){if(e.code==='ENOENT')return[];throw e;}}};}
