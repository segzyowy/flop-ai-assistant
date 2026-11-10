import { FlopClient } from "@flop-labs/client";

const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_CHARACTERS = 12000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/status") {
      const flopConfigured = Boolean(env.FLOP_API_KEY);
      return json({
        ok: flopConfigured || Boolean(env.AI),
        provider: flopConfigured ? "FLOP DevNet" : "Cloudflare Workers AI",
        model: flopConfigured ? (env.FLOP_MODEL_ID || "auto") : MODEL,
        flopConfigured,
        network: "development"
      });
    }
    if (url.pathname === "/api/chat") return handleChat(request, env);
    return env.ASSETS.fetch(request);
  }
};

function extractReply(result) {
  const candidates = [result, result?.response, result?.choices?.[0]?.message?.content,
    result?.result?.response, result?.result?.choices?.[0]?.message?.content, result?.content];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    if (Array.isArray(candidate)) {
      const text = candidate.map((part) => typeof part === "string" ? part : part?.text)
        .filter((part) => typeof part === "string").join("");
      if (text.trim()) return text;
    }
  }
  return "";
}

async function runFlopChat(messages, env) {
  const client = new FlopClient({ apiKey: env.FLOP_API_KEY });
  let model = env.FLOP_MODEL_ID;
  if (!model) {
    const catalog = await client.listModels();
    model = catalog?.data?.[0]?.id;
  }
  if (!model) throw new Error("No FLOP model is currently available.");
  const completion = await client.createChatCompletion({
    model,
    messages: [
      { role: "system", content: "You are a helpful general-purpose assistant. This request is served through FLOP DevNet, a development network separate from FLOP Testnet. Never claim that DevNet earns rewards, points, or airdrop eligibility." },
      ...messages.map(({ role, content }) => ({ role, content: content.trim() }))
    ],
    max_tokens: 512
  });
  const reply = extractReply(completion);
  if (!reply.trim()) throw new Error("The FLOP gateway returned an empty reply.");
  return json({ reply: reply.trim(), provider: "FLOP DevNet", model });
}

async function handleChat(request, env) {
  if (request.method !== "POST") return json({ error: "Use POST to send a chat message." }, 405);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Cross-site requests are not allowed." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return json({ error: "Send the message as JSON." }, 415);
  if (Number(request.headers.get("content-length") || 0) > 16000) return json({ error: "That conversation is too large. Start a new chat and try again." }, 413);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "The chat request was not valid JSON." }, 400); }
  if (!Array.isArray(body?.messages)) return json({ error: "The request must include a messages list." }, 400);

  const messages = body.messages.slice(-MAX_MESSAGES);
  let totalCharacters = 0;
  for (const message of messages) {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string" || !message.content.trim()) {
      return json({ error: "Each message needs a user or assistant role and non-empty text." }, 400);
    }
    if (message.content.length > MAX_MESSAGE_LENGTH) return json({ error: "A message is too long. Please shorten it and try again." }, 413);
    totalCharacters += message.content.length;
  }
  if (totalCharacters > MAX_TOTAL_CHARACTERS) return json({ error: "That conversation is too large. Start a new chat and try again." }, 413);
  if (!messages.some((message) => message.role === "user")) return json({ error: "Add a message before sending." }, 400);

  if (env.FLOP_API_KEY) {
    try { return await runFlopChat(messages, env); }
    catch {
      return json({ error: "FLOP DevNet could not complete this request. Check that the gateway API key is valid and that the selected model is available." }, 502);
    }
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: "You are a helpful general-purpose assistant. This app currently uses Cloudflare Workers AI and is not connected to FLOP. Never claim that FLOP network requests, rewards, points, or airdrop eligibility are active or guaranteed." },
        ...messages.map(({ role, content }) => ({ role, content: content.trim() }))
      ],
      chat_template_kwargs: { enable_thinking: false },
      max_tokens: 512
    });
    const reply = extractReply(result);
    if (!reply.trim()) return json({ error: "The AI model returned an empty reply. Please try again." }, 502);
    return json({ reply: reply.trim(), provider: "Cloudflare Workers AI", model: MODEL });
  } catch {
    return json({ error: "Cloudflare AI is temporarily unavailable. Check the Workers AI binding and the account's free daily allowance." }, 503);
  }
}
