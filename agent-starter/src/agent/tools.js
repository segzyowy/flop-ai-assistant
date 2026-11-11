export const tools = [
  {
    name: 'help',
    run: () => 'Try a normal question to talk to the AI. Local commands: help, status, remember <note>, recall, or quit.'
  },
  {
    name: 'status',
    run: ({ config, model }) =>
      `${config.name}
Public DID: ${config.did}
Local agent: ready
AI model: ${model?.displayName ?? 'not configured'}
FLOP direct-chain adapter: disabled (inference uses the DevNet gateway when AI_PROVIDER=flop)`
  },
  {
    name: 'remember',
    async run({ memory, input }) {
      const note = input.replace(/^remember\s*/i, '').trim();
      if (!note) return 'Usage: remember <note>';
      await memory.add(note);
      return 'Saved locally.';
    }
  },
  {
    name: 'recall',
    async run({ memory }) {
      const notes = await memory.list();
      return notes.length
        ? notes.slice(-10).map((note, index) => `${index + 1}. ${note.text}`).join('\n')
        : 'No notes saved yet.';
    }
  }
];
