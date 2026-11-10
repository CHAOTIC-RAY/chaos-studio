import { portfolio, showcase } from "./src/data/portfolio";
import { galleryEnabled, portfolioGalleryUrl } from "./src/features";

export interface Env {
  ASSETS: Fetcher;
}

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

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: {
          ...JSON_HEADERS,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
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

    if (url.pathname === "/" && request.method === "GET") {
      return Response.redirect(`${url.origin}/studio/`, 302);
    }

    return env.ASSETS.fetch(request);
  },
};
