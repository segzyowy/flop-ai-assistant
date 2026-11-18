export async function POST() {
  return new Response(JSON.stringify({ error: "The open AI chat has been removed. Use the structured market research board." }), {
    status: 410,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
