import { FlopClient } from "@flop-labs/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405, headers: corsHeaders,
    });
  }

  const apiKey = process.env.FLOP_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: "FLOP AI is not connected yet. The site owner must add FLOP_API_KEY in Netlify → Project configuration → Environment variables, then redeploy.",
    }), { status: 503, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length || messages.length > 24) {
      return new Response(JSON.stringify({ error: "Send between 1 and 24 messages." }), {
        status: 400, headers: corsHeaders,
      });
    }

    const safeMessages = messages
      .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));

    if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
      return new Response(JSON.stringify({ error: "A user message is required." }), {
        status: 400, headers: corsHeaders,
      });
    }

    const client = new FlopClient({ apiKey });
    const catalog = await client.listModels();
    const available = Array.isArray(catalog?.data) ? catalog.data : [];
    if (!available.length) {
      throw new Error("FLOP returned no available models. Check the gateway status and account access.");
    }

    const requestedModel = process.env.FLOP_MODEL;
    const model = requestedModel || available[0].id;
    const result = await client.createChatCompletion({
      model,
      messages: [
        {
          role: "system",
          content: "You are FLOP AI Assistant, a clear, friendly and careful general-purpose assistant. Explain concepts simply, structure complex answers, distinguish facts from uncertainty, and never invent sources, current events or financial guarantees. For medical, legal or financial topics, provide general information and encourage checking authoritative sources."
        },
        ...safeMessages,
      ],
      temperature: 0.7,
      max_tokens: 900,
    });

    const reply = result?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("FLOP returned an unexpected or empty completion response.");
    }

    return new Response(JSON.stringify({
      reply: reply.trim(),
      model,
      provider: "FLOP",
    }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("FLOP inference error:", error);
    return new Response(JSON.stringify({
      error: error?.message || "FLOP inference request failed. Please try again.",
    }), { status: 502, headers: corsHeaders });
  }
};
