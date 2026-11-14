import { handleApi, serveMedia, type WorkerEnv } from "./src/api/content-handlers";
import { portfolio, showcase } from "./src/data/portfolio";
import { galleryEnabled, portfolioGalleryUrl } from "./src/features";

export interface Env extends WorkerEnv {}

const GALLERY_DEEP = /^\/gallery\/[a-z0-9-]+\/?$/;

const JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300",
  "Access-Control-Allow-Origin": "*",
};

function galleryRedirect(url: URL): Response {
  return Response.redirect(`${url.origin}/studio/`, 302);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const api = await handleApi(request, env, url);
    if (api) return api;

    const media = await serveMedia(request, env, url);
    if (media) return media;

    if (url.pathname === "/api/portfolio" && request.method === "GET") {
      return Response.json(portfolio, { headers: JSON_HEADERS });
    }

    if (url.pathname === "/api/showcase" && request.method === "GET") {
      return Response.json(
        { ...showcase, portfolioGalleryUrl },
        { headers: JSON_HEADERS },
      );
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json(
        { ok: true, service: "design", galleryEnabled },
        { headers: JSON_HEADERS },
      );
    }

    if (url.pathname === "/studio" && request.method === "GET") {
      return Response.redirect(`${url.origin}/studio/`, 301);
    }

    if (!galleryEnabled) {
      if (
        url.pathname === "/gallery" ||
        url.pathname === "/gallery/" ||
        GALLERY_DEEP.test(url.pathname)
      ) {
        return galleryRedirect(url);
      }
    } else if (url.pathname === "/gallery" && request.method === "GET") {
      return Response.redirect(`${url.origin}/gallery/`, 301);
    } else if (
      galleryEnabled &&
      (request.method === "GET" || request.method === "HEAD") &&
      GALLERY_DEEP.test(url.pathname)
    ) {
      return env.ASSETS.fetch(new Request(new URL("/gallery/", url.origin).toString(), request));
    }

    if (url.pathname === "/" && (request.method === "GET" || request.method === "HEAD")) {
      const studioUrl = new URL("/studio/", url.origin);
      studioUrl.search = url.search;
      return env.ASSETS.fetch(new Request(studioUrl.toString(), request));
    }

    if (
      url.pathname.startsWith("/assets/hero-clips/") &&
      (url.search.includes("v=") || /\.(?:webm|mp4|jpg|jpeg)$/i.test(url.pathname))
    ) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.ok) {
        const headers = new Headers(asset.headers);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
      }
      return asset;
    }

    return env.ASSETS.fetch(request);
  },
};
