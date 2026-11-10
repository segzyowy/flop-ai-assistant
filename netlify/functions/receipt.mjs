const API_BASE = (process.env.FLOP_API_BASE_URL || "https://api.flop.network/v1").replace(/\/+$/, "");
const NETWORK = process.env.FLOP_NETWORK || "devnet";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

export default async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "GET") return json({ error: "Method not allowed." }, 405);

  const apiKey = process.env.FLOP_API_KEY;
  if (!apiKey) {
    return json({ error: "FLOP_API_KEY is not configured.", code: "FLOP_API_KEY_MISSING" }, 503);
  }

  const requestId = new URL(request.url).searchParams.get("requestId");
  if (!requestId || requestId.length > 128 || !/^[\x21-\x7e]+$/.test(requestId) || requestId === "." || requestId === "..") {
    return json({ error: "A valid requestId is required." }, 400);
  }

  try {
    const upstream = await fetch(`${API_BASE}/keys/me/receipts/${encodeURIComponent(requestId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const result = await upstream.json().catch(() => ({}));
    if (upstream.status === 404) {
      return json({
        requestId,
        network: NETWORK,
        state: "not_found",
        note: "No retained receipt was found. This does not prove that no paid work occurred.",
      }, 404);
    }
    if (!upstream.ok) {
      return json({
        error: result?.message || result?.error || `Receipt lookup failed (${upstream.status}).`,
        code: result?.error || "FLOP_RECEIPT_LOOKUP_FAILED",
        upstreamStatus: upstream.status,
        requestId,
        network: NETWORK,
      }, upstream.status);
    }

    return json({
      requestId: result.request_id || requestId,
      network: NETWORK,
      state: result.state,
      model: result.model,
      reservedSpend: result.reserved_spend,
      settledSpend: result.settled_spend,
      settledSpendRaw: result.settled_spend_raw,
      channelId: result.channel_id,
      terminalEvent: result.terminal_event,
      responseStatus: result.response_status,
      createdAt: result.created_at,
      note: "This is the gateway's current receipt ledger, not independent proof of chain finality.",
    });
  } catch (error) {
    console.error("FLOP receipt lookup failed:", error?.message || "Unknown error");
    return json({
      error: "Could not retrieve the FLOP receipt. Do not resubmit the paid request automatically.",
      code: "FLOP_RECEIPT_LOOKUP_UNKNOWN",
      requestId,
      network: NETWORK,
    }, 502);
  }
};
