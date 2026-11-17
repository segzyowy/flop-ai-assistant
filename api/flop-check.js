const FLOP_BASE = "https://api.flop.network/v1";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "Use GET for this check." });
  }

  response.setHeader("Cache-Control", "no-store");

  try {
    const [healthResponse, modelsResponse] = await Promise.all([
      fetch("https://api.flop.network/health", {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      }),
      fetch(`${FLOP_BASE}/models`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      })
    ]);

    let health = null;
    let modelIds = [];
    try {
      health = await healthResponse.json();
    } catch {
      health = { error: "FLOP health returned non-JSON." };
    }
    try {
      const catalog = await modelsResponse.json();
      modelIds = Array.isArray(catalog?.data)
        ? catalog.data.map((model) => model?.id).filter((id) => typeof id === "string")
        : [];
    } catch {
      modelIds = [];
    }

    return response.status(200).json({
      ok: healthResponse.ok && modelsResponse.ok,
      healthStatus: healthResponse.status,
      health,
      modelsStatus: modelsResponse.status,
      modelIds
    });
  } catch (error) {
    return response.status(502).json({
      ok: false,
      error: "The Vercel Function could not reach FLOP's public endpoints.",
      errorName: typeof error?.name === "string" ? error.name : "Error",
      errorCode: typeof error?.cause?.code === "string" ? error.cause.code : null
    });
  }
}
