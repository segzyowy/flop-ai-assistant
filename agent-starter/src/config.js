import path from 'node:path';
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync(path.resolve('.env'), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const did = process.env.FLOP_AGENT_DID ?? 'did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h';
if (!did.startsWith('did:key:')) throw new Error('FLOP_AGENT_DID must be a public did:key identifier.');

const aiProvider = (process.env.AI_PROVIDER ?? 'ollama').toLowerCase();
if (!['ollama', 'openai', 'flop'].includes(aiProvider)) {
  throw new Error('AI_PROVIDER must be "ollama", "openai", or "flop".');
}

export const config = Object.freeze({
  name: process.env.AGENT_NAME ?? 'FLOP Local Agent',
  did,
  storageDir: path.resolve(process.env.AGENT_STORAGE ?? './data'),
  network: process.env.FLOP_NETWORK ?? 'disabled',
  aiProvider,
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1').replace(/\/+$/, ''),
  ollamaModel: process.env.OLLAMA_MODEL ?? 'llama3.2:1b',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-6-astra',
  flopApiKey: process.env.FLOP_API_KEY ?? '',
  flopModel: process.env.FLOP_MODEL_ID ?? 'qwen/qwen2.5-0.5b-instruct'
});
