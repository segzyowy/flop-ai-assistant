import { tools } from './tools.js';

export function createAgent({ config, memory, model }) {
  const registry = new Map(tools.map((tool) => [tool.name, tool]));

  return {
    async respond(input) {
      const text = input.trim();
      if (!text) return 'Type a message or enter help to see local commands.';

      const tool = registry.get(text.split(/\s+/, 1)[0].toLowerCase());
      if (tool) return tool.run({ config, memory, input: text, model });

      if (!model) return 'AI model is not configured. Check AI_PROVIDER and its required key in the local .env file.';
      return model.respond(text);
    }
  };
}
