import { createHash, createPublicKey, verify } from "node:crypto";

const ROOM = "flop-predictions";
const ROOM_URL = "https://technocore.chat/r/" + ROOM;
const PROOF_PREFIX = "FLOP_PREDICTION_PROOF_V1 ";

function curatedMarkets(now = Date.now()) {
  const today = new Date(now);
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  const weekStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysSinceMonday);
  const closesAt = weekStart + 7 * 24 * 60 * 60 * 1000 - 60 * 1000;
  const baselineDate = new Date(weekStart - 60 * 1000).toISOString().slice(0, 10);
  const closeDate = new Date(closesAt).toISOString().slice(0, 10);
  return [
    { symbol: "BTC", name: "Bitcoin", slug: "bitcoin" },
    { symbol: "ETH", name: "Ethereum", slug: "ethereum" },
    { symbol: "SOL", name: "Solana", slug: "solana" },
    { symbol: "XRP", name: "XRP", slug: "ripple" },
    { symbol: "BNB", name: "BNB", slug: "binancecoin" },
    { symbol: "DOGE", name: "Dogecoin", slug: "dogecoin" }
  ].map(({ symbol, name, slug }, curatedOrder) => {
    const id = createHash("sha256").update(symbol + "|" + baselineDate + "|" + closeDate).digest("hex").slice(0, 16);
    const payload = {
      v: 1, type: "market", id,
      question: "Will " + name + " (" + symbol + "/USD) have a higher CoinGecko UTC daily close on " + closeDate + " than on " + baselineDate + "?",
      category: "Crypto & Markets", closesAt,
      sourceUrl: "https://www.coingecko.com/en/coins/" + slug + "/historical_data"
    };
    return {
      seq: -6 + curatedOrder, ts: new Date(weekStart).toISOString(),
      from: "FLOP curated series", nonce: "0", text: JSON.stringify(payload),
      sig: null, payload, curated: true, curatedOrder
    };
  });
}

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

function decodeBase58(value) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let number = 0n;
  for (const char of value) {
    const digit = alphabet.indexOf(char);
    if (digit < 0) throw new Error("Invalid base58 character.");
    number = number * 58n + BigInt(digit);
  }
  let hex = number === 0n ? "" : number.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const body = hex ? Buffer.from(hex, "hex") : Buffer.alloc(0);
  let zeros = 0;
  while (zeros < value.length && value[zeros] === "1") zeros++;
  return Buffer.concat([Buffer.alloc(zeros), body]);
}

function nickForDid(did) {
  return "did-" + createHash("sha256").update(did).digest("hex").slice(0, 16);
}

function publicKeyForDid(did) {
  if (typeof did !== "string" || !did.startsWith("did:key:z6Mk") || did.length > 100) {
    throw new Error("Enter an Ed25519 did:key (did:key:z6Mk…).");
  }
  const decoded = decodeBase58(did.slice("did:key:z".length));
  if (decoded.length !== 34 || decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new Error("That DID is not an Ed25519 did:key.");
  }
  const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  return createPublicKey({ key: Buffer.concat([spkiPrefix, decoded.subarray(2)]), format: "der", type: "spki" });
}

function signatureFormat(did, nonce, text, signature) {
  try {
    if (typeof nonce !== "string" || !/^[0-9]{1,19}$/.test(nonce)) return null;
    if (typeof signature !== "string" || !/^[A-Za-z0-9_-]{85}[AQgw]$/.test(signature)) return null;
    const bytes = Buffer.from(signature, "base64url");
    if (bytes.length !== 64 || bytes.toString("base64url") !== signature) return null;
    const key = publicKeyForDid(did);
    const message = Buffer.from(ROOM + "|" + nonce + "|" + text, "utf8");
    if (verify(null, message, key, bytes)) return "native";
    const wrapped = Buffer.concat([Buffer.from("<Bytes>", "utf8"), message, Buffer.from("</Bytes>", "utf8")]);
    if (verify(null, wrapped, key, bytes)) return "polkadot-wrapped";
    return null;
  } catch {
    return null;
  }
}

function cleanText(value) {
  return typeof value === "string"
    ? value.replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu, " ").trim()
    : "";
}

function parsePayload(message) {
  if (!message || typeof message.text !== "string") return null;
  let verified = message;
  let signatureType = "native";
  if (!message.sig && message.text.startsWith(PROOF_PREFIX)) {
    try {
      const proof = JSON.parse(message.text.slice(PROOF_PREFIX.length));
      if (proof?.v !== 1 || message.from !== nickForDid(proof.did) || typeof proof.text !== "string") return null;
      if (signatureFormat(proof.did, proof.nonce, proof.text, proof.sig) !== "polkadot-wrapped") return null;
      verified = { ...message, from: proof.did, nonce: String(proof.nonce), sig: proof.sig, text: proof.text };
      signatureType = "polkadot-wrapped";
    } catch {
      return null;
    }
  } else if (signatureFormat(message.from, String(message.nonce), message.text, message.sig) !== "native") {
    return null;
  }
  try {
    const payload = JSON.parse(verified.text);
    if (payload?.v !== 1 || !["market", "prediction", "resolution"].includes(payload.type)) return null;
    return { ...verified, payload, signatureType };
  } catch {
    return null;
  }
}

async function readRoom() {
  const response = await fetch(ROOM_URL + "?format=json&limit=200", {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error("Technocore returned HTTP " + response.status + ".");
  const data = await response.json();
  return {
    lastSeq: data?.last_seq ?? null,
    messages: (Array.isArray(data?.messages) ? data.messages : []).map(parsePayload).filter(Boolean)
  };
}

function validHttpsUrl(value, optional = false) {
  if (optional && !value) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function validatePayload(payload) {
  const now = Date.now();
  if (!payload || payload.v !== 1) return "Unsupported market record.";
  if (payload.type === "market") {
    if (typeof payload.id !== "string" || !/^[a-f0-9]{16}$/.test(payload.id)) return "Market ID is invalid.";
    if (typeof payload.question !== "string" || !payload.question.trim() || payload.question.length > 180) return "Write a question of 1–180 characters.";
    if (!["FLOP", "AI agents", "Builders", "Other", "FLOP Network", "AI & Agents", "Crypto & Markets", "Tools & Builders", "Community"].includes(payload.category)) return "Choose a valid category.";
    if (!Number.isSafeInteger(payload.closesAt) || payload.closesAt < now + 60_000 || payload.closesAt > now + 90 * 24 * 60 * 60 * 1000) return "Choose a closing time between 1 minute and 90 days from now.";
    if (!validHttpsUrl(payload.sourceUrl, true)) return "The reference link must start with https://.";
  } else if (payload.type === "prediction") {
    if (typeof payload.marketId !== "string" || !/^[a-f0-9]{16}$/.test(payload.marketId)) return "Market ID is invalid.";
    if (!["YES", "NO"].includes(payload.outcome)) return "Choose YES or NO.";
  } else if (payload.type === "resolution") {
    if (typeof payload.marketId !== "string" || !/^[a-f0-9]{16}$/.test(payload.marketId)) return "Market ID is invalid.";
    if (!["YES", "NO", "VOID"].includes(payload.outcome)) return "Choose YES, NO, or VOID.";
    if (!validHttpsUrl(payload.evidenceUrl)) return "Add an https:// source for the result.";
  }
  return null;
}

export async function getMarkets(request) {
  if (request.method !== "GET") return json({ error: "Use GET to read the community markets." }, 405);
  try {
    const room = await readRoom();
    return json({
      ok: true,
      room: ROOM,
      roomUrl: ROOM_URL,
      lastSeq: room.lastSeq,
      messages: [
        ...curatedMarkets(),
        ...room.messages.map(({ seq, ts, from, nonce, text, sig, payload }) => ({ seq, ts, from, nonce: String(nonce), text, sig, payload }))
      ]
    });
  } catch {
    return json({ ok: false, error: "Could not load the public Technocore market room. Try again shortly." }, 503);
  }
}

export async function postMarketRecord(request) {
  if (request.method !== "POST") return json({ error: "Use POST to publish a signed market record." }, 405);
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "This request must come from this website." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Send the signed record as JSON." }, 415);
  }
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 6000) return json({ error: "The market record is too large." }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "The market record was not valid JSON." }, 400);
  }

  const { did, nonce, sig, text } = body || {};
  if (typeof text !== "string" || !text || text.length > 3500 || cleanText(text) !== text) {
    return json({ error: "The signed record must be one clean line under 3,500 characters." }, 400);
  }
  const signatureType = signatureFormat(did, nonce, text, sig);
  if (!signatureType) {
    return json({ error: "The signature did not verify for that Ed25519 DID. Confirm the selected Ed25519 wallet account matches the DID." }, 400);
  }

  let payload;
  try { payload = JSON.parse(text); } catch { return json({ error: "The signed market data was invalid." }, 400); }
  const validationError = validatePayload(payload);
  if (validationError) return json({ error: validationError }, 400);

  try {
    const room = await readRoom();
    const marketRecords = room.messages.filter(m => m.payload.type === "market" && m.payload.id === payload.marketId);
    const market = marketRecords[0];
    const resolutions = room.messages.filter(m => m.payload.type === "resolution" && m.payload.marketId === payload.marketId);

    if (payload.type === "prediction") {
      const curatedMarket = curatedMarkets().find(item => item.payload.id === payload.marketId);
      if (!market && !curatedMarket) return json({ error: "That market is not in the current public record. Refresh the page and try again." }, 409);
      const closesAt = market?.payload.closesAt ?? curatedMarket.payload.closesAt;
      if (resolutions.length || Date.now() >= closesAt) return json({ error: "Predictions for this market are closed." }, 409);
    }
    if (payload.type === "resolution") {
      if (!market) return json({ error: "That market is not in the current public record." }, 409);
      if (market.from !== did) return json({ error: "Only the wallet that created this market can record its result." }, 403);
      if (Date.now() < market.payload.closesAt) return json({ error: "Wait until the prediction deadline before resolving this market." }, 409);
      if (resolutions.length) return json({ error: "This market already has a recorded result." }, 409);
    }
    if (payload.type === "market" && (marketRecords.length || curatedMarkets().some(item => item.payload.id === payload.id))) return json({ error: "That market ID is already in use. Refresh and create another." }, 409);

    const upstreamRecord = signatureType === "native"
      ? { did, sig, nonce, text }
      : {
          from: nickForDid(did),
          text: PROOF_PREFIX + JSON.stringify({ v: 1, did, nonce, sig, text })
        };
    const upstream = await fetch(ROOM_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(upstreamRecord),
      signal: AbortSignal.timeout(10000)
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      const message = upstream.status === 409
        ? "Technocore rejected the nonce. Refresh and sign again."
        : upstream.status === 422
          ? "Technocore is filtering duplicate posts. Change the text or try later."
          : "Technocore rejected the post (HTTP " + upstream.status + ").";
      return json({ error: message, upstreamStatus: upstream.status, detail: detail.slice(0, 200) }, 502);
    }
    return json({ ok: true, room: ROOM, message: "The signed record was accepted by Technocore." });
  } catch {
    return json({ error: "Could not reach Technocore. The record was not confirmed as posted." }, 502);
  }
}

export const GET = getMarkets;
export const POST = postMarketRecord;
