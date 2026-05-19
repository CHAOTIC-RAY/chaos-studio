export interface Env {
  ASSETS: Fetcher;
}

const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

async function handleApi(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    return json({
      status: "ok",
      service: "portfolio",
      timestamp: new Date().toISOString(),
    });
  }

  if (url.pathname === "/api/profile" && request.method === "GET") {
    return json({
      name: "CHAOTIC-RAY",
      title: "Graphic Designer",
      tagline: "Brand identity, editorial layout, and visual systems.",
      links: {
        github: "https://github.com/CHAOTIC-RAY",
        behance: "https://www.behance.net/",
        dribbble: "https://dribbble.com/",
      },
    });
  }

  if (url.pathname === "/api/contact" && request.method === "POST") {
    let body: { name?: string; email?: string; message?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { name, email, message } = body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return json({ error: "name, email, and message are required" }, 400);
    }

    // Contact submissions can be wired to KV, email, or a queue later.
    return json({
      ok: true,
      message: "Thanks for reaching out. Your message was received.",
    });
  }

  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request);
    }

    return env.ASSETS.fetch(request);
  },
};
