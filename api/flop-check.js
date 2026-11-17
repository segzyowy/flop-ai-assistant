const FLOP_BASE = "https://api.flop.network/v1";

async function checkEndpoint(url) {
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = { error: "Endpoint returned non-JSON." };
    }
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return {
      ok: false,
      status: null,
      errorName: typeof error?.name === "string" ? error.name : "Error",
      errorCode: typeof error?.cause?.code === "string" ? error.cause.code : null
    };
  }
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "Use GET for this check." });
  }

  response.setHeader("Cache-Control", "no-store");
  const [health, models] = await Promise.all([
    checkEndpoint("https://api.flop.network/health"),
    checkEndpoint(`${FLOP_BASE}/models`)
  ]);
  const modelIds = Array.isArray(models.body?.data)
    ? models.body.data.map((model) => model?.id).filter((id) => typeof id === "string")
    : [];

  return response.status(200).json({
    ok: health.ok && models.ok,
    health: {
      ok: health.ok,
      status: health.status,
      networkStatus: health.body?.network?.status ?? null,
      network: health.body?.network?.network ?? null,
      errorName: health.errorName ?? null,
      errorCode: health.errorCode ?? null
    },
    models: {
      ok: models.ok,
      status: models.status,
      ids: modelIds,
      errorName: models.errorName ?? null,
      errorCode: models.errorCode ?? null
    }
  });
}
