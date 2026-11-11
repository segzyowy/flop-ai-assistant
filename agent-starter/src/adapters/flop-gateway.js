import { FlopClient } from '@flop-labs/client';

const INSTRUCTIONS = 'You are the user’s AI agent using the FLOP DevNet inference gateway. Be helpful, clear, and honest. DevNet is for testing and offers no rewards.';

export function createFlopGatewayAdapter(config) {
  const client = config.flopApiKey
    ? new FlopClient({ apiKey: config.flopApiKey })
    : null;
  const history = [];

  return {
    configured: Boolean(client),
    displayName: `FLOP DevNet gateway (${config.flopModel})`,

    async respond(text) {
      if (!client) {
        return 'FLOP gateway is not configured. Add FLOP_API_KEY to the local .env file and restart.';
      }

      let result;
      try {
        result = await client.createChatCompletion({
          model: config.flopModel,
          messages: [
            { role: 'system', content: INSTRUCTIONS },
            ...history,
            { role: 'user', content: text }
          ],
          max_tokens: 128
        });
      } catch (error) {
        const status = Number(error?.status ?? error?.statusCode);
        if (status === 401) return 'FLOP rejected the gateway key. Check whether it has expired and confirm FLOP_API_KEY is set in your local .env file.';
        if (status === 402) return 'FLOP gateway quota is exhausted. Check the key’s allowance in the FLOP API.';
        if (status === 404) return 'The configured FLOP model is unavailable or outside this key’s model scope. Check FLOP_MODEL_ID.';
        if (status === 429) return 'FLOP gateway is overloaded. Wait a while before trying again.';
        if (status === 503) return 'FLOP gateway is temporarily unavailable. Try again later.';
        return 'Could not complete a FLOP gateway request. Check your internet connection and the FLOP API status.';
      }

      const answer = result?.choices?.[0]?.message?.content?.trim();
      if (!answer) return 'FLOP returned an empty reply. Please try again later.';

      history.push({ role: 'user', content: text }, { role: 'assistant', content: answer });
      if (history.length > 20) history.splice(0, history.length - 20);
      return answer;
    }
  };
}
