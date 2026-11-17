import { FlopClient } from "@flop-labs/client";

const MODEL_DEFAULT = "qwen/qwen2.5-0.5b-instruct";
const DID = "did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h";
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

export function getStatus(request) {
  if (request.method !== "GET") return json({ error: "Use GET to check status." }, 405);
  const configured = Boolean(process.env.FLOP_API_KEY);
  return json({
    ok: configured,
    provider: configured ? "FLOP DevNet" : "Unconfigured",
    model: configured ? (process.env.FLOP_MODEL_ID || MODEL_DEFAULT) : null,
    flopConfigured: configured,
    network: "development"
  });
}

export async function getTechnocoreStatus(request) {
  if (request.method !== "GET") return json({ error: "Use GET to check Technocore status." }, 405);
  try {
    const response = await fetch("https://technocore.chat/.well-known/agent.json", {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    return json({
      available: response.ok,
      service: "Technocore",
      message: response.ok
        ? "Technocore is reachable. Connect the wallet for this DID and sign a public lobby check-in."
        : "Technocore did not respond successfully. Try again later."
    }, response.ok ? 200 : 503);
  } catch {
    return json({ available: false, service: "Technocore", message: "Technocore could not be reached right now." }, 503);
  }
}

export async function postTechnocore(request) {
  if (request.method !== "POST") return json({ error: "Use POST to publish a signed check-in." }, 405);
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin) return json({ error: "This request must come from this website." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Send the signed check-in as JSON." }, 415);
  }
  if (Number(request.headers.get("content-length") || 0) > 4096) return json({ error: "The check-in request is too large." }, 413);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: "The check-in request is too large." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "The check-in was not valid JSON." }, 400);
  }
  if (body?.did !== DID) return json({ error: "The DID does not match this app's configured public identity." }, 400);
  if (typeof body?.nonce !== "string" || !/^[0-9]{1,19}$/.test(body.nonce)) {
    return json({ error: "The signature nonce must contain 1–19 digits." }, 400);
  }
  if (typeof body?.sig !== "string" || !/^[A-Za-z0-9_-]{85}[AQgw]$/.test(body.sig)) {
    return json({ error: "The wallet returned a signature in an unsupported format." }, 400);
  }
  if (typeof body?.text !== "string" || !body.text.trim() || body.text.length > 240) {
    return json({ error: "Write a public check-in of 1–240 characters." }, 400);
  }
  const swept = body.text.replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu, " ").trim();
  if (swept !== body.text) return json({ error: "The check-in contains hidden or line-break characters. Edit it and sign again." }, 400);

  try {
    const upstream = await fetch("https://technocore.chat/r/lobby", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ did: DID, sig: body.sig, nonce: body.nonce, text: body.text }),
      signal: AbortSignal.timeout(10000)
    });
    if (!upstream.ok) {
      const message = upstream.status === 409
        ? "Technocore rejected the nonce. Sign again with a fresh nonce."
        : upstream.status === 422
          ? "Technocore is filtering duplicate messages. Change the check-in text and sign again."
          : "Technocore rejected the signed check-in (HTTP " + upstream.status + ").";
      return json({ error: message, upstreamStatus: upstream.status }, 502);
    }
    return json({ ok: true, message: "Technocore accepted the signed public check-in.", room: "lobby", did: DID });
  } catch {
    return json({ error: "The site could not reach Technocore. Your wallet signature was not confirmed as posted." }, 502);
  }
}

function extractReply(result) {
  const candidates = [
    result,
    result?.response,
    result?.choices?.[0]?.message?.content,
    result?.result?.response,
    result?.result?.choices?.[0]?.message?.content,
    result?.content
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    if (Array.isArray(candidate)) {
      const text = candidate.map(part => typeof part === "string" ? part : part?.text)
        .filter(part => typeof part === "string").join("");
      if (text.trim()) return text;
    }
  }
  return "";
}

async function runFlopChat(messages) {
  const client = new FlopClient({ apiKey: process.env.FLOP_API_KEY });
  let model = process.env.FLOP_MODEL_ID;
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
  return { reply: reply.trim(), provider: "FLOP DevNet", model };
}

export async function postChat(request) {
  if (request.method !== "POST") return json({ error: "Use POST to send a chat message." }, 405);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Cross-site requests are not allowed." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Send the message as JSON." }, 415);
  }
  if (Number(request.headers.get("content-length") || 0) > 16000) {
    return json({ error: "That conversation is too large. Start a new chat and try again." }, 413);
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return json({ error: "That conversation is too large. Start a new chat and try again." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "The chat request was not valid JSON." }, 400);
  }
  if (!Array.isArray(body?.messages)) return json({ error: "The request must include a messages list." }, 400);

  const messages = body.messages.slice(-MAX_MESSAGES);
  let totalCharacters = 0;
  for (const message of messages) {
    if (!message || !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" || !message.content.trim()) {
      return json({ error: "Each message needs a user or assistant role and non-empty text." }, 400);
    }
    if (message.content.length > MAX_MESSAGE_LENGTH) return json({ error: "A message is too long. Please shorten it and try again." }, 413);
    totalCharacters += message.content.length;
  }
  if (totalCharacters > MAX_TOTAL_CHARACTERS) return json({ error: "That conversation is too large. Start a new chat and try again." }, 413);
  if (!messages.some(message => message.role === "user")) return json({ error: "Add a message before sending." }, 400);
  if (!process.env.FLOP_API_KEY) {
    return json({
      error: "FLOP DevNet is not configured on this Vercel deployment. Add FLOP_API_KEY in Vercel Project Settings, then redeploy.",
      provider: "Unconfigured"
    }, 503);
  }

  try {
    return json(await runFlopChat(messages));
  } catch (error) {
    const upstreamStatus = Number(error?.status);
    let message = "The FLOP gateway request failed.";
    if (upstreamStatus === 401 || upstreamStatus === 403) {
      message = "FLOP rejected the gateway key or its access (HTTP " + upstreamStatus + ").";
    } else if (upstreamStatus === 400 || upstreamStatus === 404) {
      message = "FLOP rejected the selected model or request (HTTP " + upstreamStatus + ").";
    } else if (upstreamStatus === 429 || upstreamStatus === 503) {
      message = "FLOP is rate-limited or temporarily unavailable (HTTP " + upstreamStatus + ").";
    } else if (Number.isInteger(upstreamStatus) && upstreamStatus >= 400) {
      message = "FLOP returned an HTTP " + upstreamStatus + " error.";
    } else if (!Number.isFinite(upstreamStatus) || upstreamStatus <= 0) {
      message = "The Vercel Function could not reach the FLOP gateway.";
    } else {
      message = "The FLOP gateway returned an unexpected response.";
    }
    return json({
      error: message,
      provider: "FLOP DevNet",
      ...(Number.isInteger(upstreamStatus) && upstreamStatus > 0 ? { upstreamStatus } : {})
    }, 502);
  }
}
