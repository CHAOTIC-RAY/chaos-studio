import { portfolio } from "./src/data/portfolio";

export interface Env {
  ASSETS: Fetcher;
}

const JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300",
  "Access-Control-Allow-Origin": "*",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/portfolio" && request.method === "GET") {
      return Response.json(portfolio, { headers: JSON_HEADERS });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json({ ok: true, service: "portfolio" }, { headers: JSON_HEADERS });
    }

    if (url.pathname === "/api/profile" && request.method === "GET") {
      return Response.json(
        {
          name: portfolio.profile.name,
          title: portfolio.profile.role,
          tagline: portfolio.profile.tagline,
          links: {
            github: "https://github.com/CHAOTIC-RAY",
            instagram: portfolio.contact.instagramUrl,
            portfolio: portfolio.profile.portfolioUrl,
          },
        },
        { headers: JSON_HEADERS },
      );
    }

    if (url.pathname === "/api/contact" && request.method === "POST") {
      let body: { name?: string; email?: string; message?: string };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: JSON_HEADERS });
      }
      const { name, email, message } = body;
      if (!name?.trim() || !email?.trim() || !message?.trim()) {
        return Response.json(
          { error: "name, email, and message are required" },
          { status: 400, headers: JSON_HEADERS },
        );
      }
      return Response.json(
        { ok: true, message: "Thanks for reaching out. Your message was received." },
        { headers: JSON_HEADERS },
      );
    }

    if (url.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: {
          ...JSON_HEADERS,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
