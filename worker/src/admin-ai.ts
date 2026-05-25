/** Admin AI proxy — forwards chat to Ollama when browser cannot reach it directly */

export interface AdminAiEnv {
  OLLAMA_BASE_URL?: string;
}

export async function handleAdminAiChat(
  request: Request,
  env: AdminAiEnv,
): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  }

  let body: { messages?: unknown[]; model?: string; ollamaUrl?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
  }

  const base = (env.OLLAMA_BASE_URL || body.ollamaUrl || "").replace(/\/$/, "");
  if (!base) {
    return Response.json(
      {
        error:
          "No Ollama URL. Set OLLAMA_BASE_URL on the worker, or pass ollamaUrl in the request body.",
      },
      { status: 503, headers: cors },
    );
  }

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: body.model || "llama3.2",
      messages: body.messages || [],
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err.slice(0, 500) }, { status: res.status, headers: cors });
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return Response.json(
    { content: data.message?.content || "" },
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
}
