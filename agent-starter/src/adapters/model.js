import { createFlopGatewayAdapter } from './flop-gateway.js';
import { createOllamaAdapter } from './ollama.js';
import { createOpenAIAdapter } from './openai.js';

export function createModelAdapter(config, request) {
  if (config.aiProvider === 'ollama') return createOllamaAdapter(config, request);
  if (config.aiProvider === 'flop') return createFlopGatewayAdapter(config);
  const model = createOpenAIAdapter(config, request);
  return { ...model, displayName: `OpenAI (${config.openaiModel})` };
}
