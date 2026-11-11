import {
  checkLoginRate,
  clearLoginFails,
  clearSessionCookie,
  createSessionCookie,
  recordLoginFail,
  timingSafeEqual,
  verifySession,
} from "../auth/session";
import {
  getHistory,
  getPublished,
  restoreDefaults,
  restoreFromHistory,
  saveContent,
} from "../content/store";
import type { SiteContent } from "../content/types";

export interface WorkerEnv {
  ASSETS: Fetcher;
  CONTENT?: KVNamespace;
  MEDIA?: R2Bucket;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}

const JSON_PUBLIC: HeadersInit = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60",
  "Access-Control-Allow-Origin": "*",
};

const JSON_PRIVATE: HeadersInit = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function clientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function handleApi(request: Request, env: WorkerEnv, url: URL): Promise<Response | null> {
  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    return corsPreflight();
  }

  if (url.pathname === "/api/content" && request.method === "GET") {
    const content = await getPublished(env.CONTENT);
    return Response.json(content, { headers: JSON_PUBLIC });
  }

  if (url.pathname === "/api/content/history" && request.method === "GET") {
    if (!(await verifySession(request, env.SESSION_SECRET))) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: JSON_PRIVATE });
    }
    if (!env.CONTENT) return Response.json({ history: [] }, { headers: JSON_PRIVATE });
    const history = await getHistory(env.CONTENT);
    return Response.json(
      { history: history.map((h) => ({ savedAt: h.savedAt })) },
      { headers: JSON_PRIVATE },
    );
  }

  if (url.pathname === "/api/content/restore-defaults" && request.method === "POST") {
    if (!(await verifySession(request, env.SESSION_SECRET))) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: JSON_PRIVATE });
    }
    if (!env.CONTENT) return Response.json({ error: "KV not configured" }, { status: 503, headers: JSON_PRIVATE });
    const content = await restoreDefaults(env.CONTENT);
    return Response.json(content, { headers: JSON_PRIVATE });
  }

  if (url.pathname === "/api/content/restore" && request.method === "POST") {
    if (!(await verifySession(request, env.SESSION_SECRET))) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: JSON_PRIVATE });
    }
    if (!env.CONTENT) return Response.json({ error: "KV not configured" }, { status: 503, headers: JSON_PRIVATE });
    const body = (await request.json()) as { savedAt?: string };
    if (!body.savedAt) return Response.json({ error: "savedAt required" }, { status: 400, headers: JSON_PRIVATE });
    const content = await restoreFromHistory(env.CONTENT, body.savedAt);
    if (!content) return Response.json({ error: "Version not found" }, { status: 404, headers: JSON_PRIVATE });
    return Response.json(content, { headers: JSON_PRIVATE });
  }

  if (url.pathname === "/api/content" && request.method === "PUT") {
    if (!(await verifySession(request, env.SESSION_SECRET))) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: JSON_PRIVATE });
    }
    if (!env.CONTENT) return Response.json({ error: "KV not configured" }, { status: 503, headers: JSON_PRIVATE });
    let payload: SiteContent;
    try {
      payload = (await request.json()) as SiteContent;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400, headers: JSON_PRIVATE });
    }
    if (!payload || typeof payload !== "object") {
      return Response.json({ error: "Invalid content" }, { status: 400, headers: JSON_PRIVATE });
    }
    const content = await saveContent(env.CONTENT, payload);
    return Response.json(content, { headers: JSON_PRIVATE });
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const ip = clientIp(request);
    if (!(await checkLoginRate(env.CONTENT, ip))) {
      return Response.json({ error: "Too many attempts" }, { status: 429, headers: JSON_PRIVATE });
    }
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
      return Response.json({ error: "Admin auth not configured" }, { status: 503, headers: JSON_PRIVATE });
    }
    let password = "";
    try {
      const body = (await request.json()) as { password?: string };
      password = body.password || "";
    } catch {
      return Response.json({ error: "Invalid body" }, { status: 400, headers: JSON_PRIVATE });
    }
    if (!timingSafeEqual(password, env.ADMIN_PASSWORD)) {
      await recordLoginFail(env.CONTENT, ip);
      return Response.json({ error: "Invalid password" }, { status: 401, headers: JSON_PRIVATE });
    }
    await clearLoginFails(env.CONTENT, ip);
    const cookie = await createSessionCookie(env.SESSION_SECRET);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...JSON_PRIVATE, "Set-Cookie": cookie },
    });
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...JSON_PRIVATE, "Set-Cookie": clearSessionCookie() },
    });
  }

  if (url.pathname === "/api/auth/session" && request.method === "GET") {
    const ok = await verifySession(request, env.SESSION_SECRET);
    return Response.json({ authenticated: ok }, { headers: JSON_PRIVATE });
  }

  if (url.pathname === "/api/media/upload" && request.method === "POST") {
    if (!(await verifySession(request, env.SESSION_SECRET))) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: JSON_PRIVATE });
    }
    if (!env.MEDIA) {
      return Response.json({ error: "R2 not configured" }, { status: 503, headers: JSON_PRIVATE });
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "file required" }, { status: 400, headers: JSON_PRIVATE });
    }
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    return Response.json({ url: `/media/${key}` }, { headers: JSON_PRIVATE });
  }

  return null;
}

export async function serveMedia(request: Request, env: WorkerEnv, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/media/")) return null;
  if (!env.MEDIA) return new Response("Media storage not configured", { status: 503 });
  const key = url.pathname.slice("/media/".length);
  if (!key || key.includes("..")) return new Response("Not found", { status: 404 });
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", obj.httpEtag);
  return new Response(obj.body, { headers });
}
