import { portfolio } from "../backend/src/data/portfolio";

export interface Env {
  ASSETS: Fetcher;
}

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/portfolio") {
      return Response.json(portfolio, { headers: JSON_HEADERS });
    }

    if (url.pathname === "/api/health") {
      return Response.json({ ok: true }, { headers: JSON_HEADERS });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
