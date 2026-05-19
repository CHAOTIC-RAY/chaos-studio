# Ibrahim Wafig — Portfolio

Graphic design portfolio (ChaosStudio.mv) on **Cloudflare Workers**: React frontend, `/api/portfolio` data, static assets.

## Local development

```bash
npm install
npm run dev
```

Opens Wrangler dev with the Worker API and Vite-built frontend.

## Deploy

```bash
npm run deploy
```

**Cloudflare Workers Builds** — set **Deploy command** to `npm run deploy` (not `npx wrangler deploy` alone).

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Content

- Portfolio data: `worker/src/data/portfolio.ts`
- Project screenshots: `frontend/public/images/projects/`
- Styles: purple glass CV theme in `frontend/src/App.css` and `frontend/src/styles/global.css`
