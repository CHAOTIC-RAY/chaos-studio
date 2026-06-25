import { portfolio } from "./src/data/portfolio";
import { handleAdminAiChat, type AdminAiEnv } from "./src/admin-ai";
import {
  handleGithubApply,
  handleGithubVerify,
  type GithubApplyEnv,
} from "./src/admin-github";

export interface Env extends AdminAiEnv, GithubApplyEnv {
  ASSETS: Fetcher;
}

/** Client-side routes that must serve index.html on direct navigation */
const SPA_ROUTES = new Set(["/studio", "/gallery"]);

function isAssetPath(pathname: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

async function serveSpaDocument(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return null;
  if (isAssetPath(url.pathname)) return null;

  const path = url.pathname.replace(/\/$/, "") || "/";
  if (!SPA_ROUTES.has(path)) return null;

  const indexUrl = new URL("/index.html", url.origin);
  return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
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

    if (url.pathname === "/api/admin/ai/chat") {
      return handleAdminAiChat(request, env);
    }

    if (url.pathname === "/api/admin/github/apply") {
      return handleGithubApply(request, env);
    }

    if (url.pathname === "/api/admin/github/verify") {
      return handleGithubVerify(request, env);
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

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: {
          ...JSON_HEADERS,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // CMS admin is static under /admin/ — must not fall through to portfolio SPA
    if (url.pathname === "/admin" || url.pathname === "/admin/index.html") {
      return Response.redirect(`${url.origin}/admin/`, 302);
    }
    if (url.pathname.startsWith("/admin/")) {
      return env.ASSETS.fetch(request);
    }

    const spa = await serveSpaDocument(request, env);
    if (spa) return spa;

    return env.ASSETS.fetch(request);
  },
};
