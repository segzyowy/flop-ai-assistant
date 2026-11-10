const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_CHARACTERS = 12000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/status") {
      return json({
        ok: Boolean(env.AI),
        provider: "Cloudflare Workers AI",
        model: MODEL,
        flopNetwork: "disabled"
      });
    }

    if (url.pathname === "/api/chat") {
      return handleChat(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleChat(request, env) {
  if (request.method !== "POST") {
    return json({ error: "Use POST to send a chat message." }, 405);
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Cross-site requests are not allowed." }, 403);
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Send the message as JSON." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16000) {
    return json({ error: "That conversation is too large. Start a new chat and try again." }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "The chat request was not valid JSON." }, 400);
  }

  if (!Array.isArray(body?.messages)) {
    return json({ error: "The request must include a messages list." }, 400);
  }

  const messages = body.messages.slice(-MAX_MESSAGES);
  let totalCharacters = 0;
  for (const message of messages) {
    if (!message || !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" || !message.content.trim()) {
      return json({ error: "Each message needs a user or assistant role and non-empty text." }, 400);
    }
    if (message.content.length > MAX_MESSAGE_LENGTH) {
      return json({ error: "A message is too long. Please shorten it and try again." }, 413);
    }
    totalCharacters += message.content.length;
  }
  if (totalCharacters > MAX_TOTAL_CHARACTERS) {
    return json({ error: "That conversation is too large. Start a new chat and try again." }, 413);
  }
  if (!messages.some((message) => message.role === "user")) {
    return json({ error: "Add a message before sending." }, 400);
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        {
          role: "system",
          content: "You are a helpful general-purpose assistant. This app uses Cloudflare Workers AI. You are not connected to the FLOP network or FLOP Testnet. Never claim that FLOP network requests, rewards, points, or airdrop eligibility are active or guaranteed. If asked about FLOP network status, explain that this app's FLOP connection is disabled."
        },
        ...messages.map(({ role, content }) => ({ role, content: content.trim() }))
      ],
      max_tokens: 512
    });

    const reply = typeof result === "string" ? result : result?.response;
    if (typeof reply !== "string" || !reply.trim()) {
      return json({ error: "The AI model returned an empty reply. Please try again." }, 502);
    }
    return json({ reply: reply.trim(), provider: "Cloudflare Workers AI", model: MODEL });
  } catch {
    return json({
      error: "Cloudflare AI is temporarily unavailable. Check the Workers AI binding and the account's free daily allowance."
    }, 503);
  }
}
