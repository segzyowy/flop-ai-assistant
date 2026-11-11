import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { config } from './config.js';
import { createMemory } from './agent/memory.js';
import { createAgent } from './agent/agent.js';
import { createFlopAdapter } from './adapters/flop.js';
import { createModelAdapter } from './adapters/model.js';

const memory = createMemory(config.storageDir);
const model = createModelAdapter(config);
const agent = createAgent({ config, memory, model });
const flop = createFlopAdapter();
const command = process.argv[2] ?? 'chat';

if (command === 'status') {
  console.log(await agent.respond('status'));
  console.log(`FLOP direct-chain adapter: ${(await flop.status()).reason}`);
} else if (command === 'chat') {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  console.log(`${config.name} (${model.displayName}). Type help or quit.`);
  try {
    while (true) {
      const input = await rl.question('you> ');
      if (['quit', 'exit'].includes(input.trim().toLowerCase())) break;
      console.log(`agent> ${await agent.respond(input)}`);
    }
  } finally {
    rl.close();
  }
} else {
  console.error('Use "chat" or "status".');
  process.exitCode = 2;
}
