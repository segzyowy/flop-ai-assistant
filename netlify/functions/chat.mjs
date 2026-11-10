import { randomUUID } from "node:crypto";

const API_BASE = (process.env.FLOP_API_BASE_URL || "https://api.flop.network/v1").replace(/\/+$/, "");
const NETWORK = process.env.FLOP_NETWORK || "devnet";
const MAX_COST = Number(process.env.FLOP_MAX_COST || "2");
const MAX_TOKENS = Number(process.env.FLOP_MAX_TOKENS || "128");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

async function readJson(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; }
  catch { return { message: text.slice(0, 500) }; }
}

function isValidMessage(message) {
  return message &&
    ["user", "assistant"].includes(message.role) &&
    typeof message.content === "string" &&
    message.content.trim().length > 0;
}

export default async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const apiKey = process.env.FLOP_API_KEY;
  if (!apiKey) {
    return json({
      error: "FLOP inference is not configured. The site owner must add FLOP_API_KEY in Netlify environment variables.",
      code: "FLOP_API_KEY_MISSING",
    }, 503);
  }

  if (!Number.isFinite(MAX_COST) || MAX_COST <= 0 || !Number.isInteger(MAX_TOKENS) || MAX_TOKENS < 1) {
    return json({ error: "Invalid FLOP_MAX_COST or FLOP_MAX_TOKENS server configuration." }, 500);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Request body must be valid JSON." }, 400); }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  if (!incoming.length || incoming.length > 24) {
    return json({ error: "Send between 1 and 24 messages." }, 400);
  }

  const messages = incoming.filter(isValidMessage).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 6000),
  }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "A user message is required." }, 400);
  }

  const requestId = randomUUID();

  try {
    // Model discovery is public. We choose the cheapest currently advertised model
    // unless the owner pins FLOP_MODEL in Netlify.
    const catalogResponse = await fetch(`${API_BASE}/models?availability=ready`, {
      headers: { Accept: "application/json" },
    });
    const catalog = await readJson(catalogResponse);
    if (!catalogResponse.ok) {
      return json({
        error: catalog?.message || catalog?.error || "FLOP model discovery failed.",
        code: "FLOP_MODEL_DISCOVERY_FAILED",
        network: NETWORK,
      }, 502);
    }

    const models = Array.isArray(catalog?.data) ? catalog.data : [];
    if (!models.length) {
      return json({
        error: "FLOP currently advertises no ready inference models.",
        code: "FLOP_NO_READY_MODELS",
        network: NETWORK,
      }, 503);
    }

    const requestedModel = process.env.FLOP_MODEL;
    const cheapest = [...models].sort((a, b) => {
      const cost = (m) => Number(m?.pricing?.prompt || 0) + Number(m?.pricing?.completion || 0);
      return cost(a) - cost(b);
    })[0];
    const model = requestedModel || cheapest.id;

    if (!models.some((item) => item.id === model)) {
      return json({
        error: "FLOP_MODEL is not in the currently advertised ready-model list.",
        code: "FLOP_MODEL_NOT_READY",
        model,
        network: NETWORK,
      }, 503);
    }

    const upstream = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Request-ID": requestId,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are FLOP AI Assistant. Be clear, useful and careful. Distinguish facts from uncertainty. Do not invent sources, current events, transactions, miners, receipts or airdrop rewards.",
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: MAX_TOKENS,
        max_cost_flop: MAX_COST,
      }),
    });

    const result = await readJson(upstream);
    if (!upstream.ok) {
      const retryAfter = upstream.headers.get("Retry-After");
      return json({
        error: result?.message || result?.error?.message || result?.error || `FLOP inference failed (${upstream.status}).`,
        code: result?.code || result?.error?.code || "FLOP_INFERENCE_FAILED",
        upstreamStatus: upstream.status,
        retryAfter,
        requestId,
        model,
        network: NETWORK,
        settlement: "not_confirmed",
      }, upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502);
    }

    const reply = result?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return json({
        error: "FLOP returned no text completion. Check the request receipt before trying again.",
        code: "FLOP_EMPTY_COMPLETION",
        requestId,
        model,
        network: NETWORK,
        settlement: "unknown",
      }, 502);
    }

    return json({
      reply: reply.trim(),
      provider: "FLOP Network",
      network: NETWORK,
      model,
      requestId,
      usage: result?.usage || null,
      settlement: "pending_receipt_check",
      receiptEndpoint: "/.netlify/functions/receipt",
    });
  } catch (error) {
    // Do not automatically retry a paid inference request after a network error:
    // the gateway may have accepted it even if this function did not receive the reply.
    console.error("FLOP request failed:", error?.message || "Unknown error");
    return json({
      error: "The FLOP request could not be confirmed. Check its receipt before submitting another paid request.",
      code: "FLOP_REQUEST_OUTCOME_UNKNOWN",
      requestId,
      network: NETWORK,
      settlement: "unknown",
    }, 502);
  }
};
