# Portfolio

Graphic design portfolio built with **Vite** (frontend), **Cloudflare Workers** (API + static hosting), and editable assets in `frontend/public/assets/`.

## Edit images & logos

See **[frontend/public/assets/README.md](frontend/public/assets/README.md)**.

1. Replace files under `frontend/public/assets/` (keep filenames or update `site.config.json`).
2. Edit **`frontend/public/assets/site.config.json`** for project titles, links, and alt text.

## Local development

```bash
npm install
npm run build:frontend
npm run dev
```

Open the URL Wrangler prints (API + static assets together).

Frontend-only hot reload:

```bash
npm run dev --workspace=frontend
```

## Build & deploy

```bash
npm run build
npm run deploy
```

Requires `wrangler login` locally, or GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN` — **Edit Cloudflare Workers** permission
- `CLOUDFLARE_ACCOUNT_ID` — your account ID

Pushes to `main` deploy via `.github/workflows/deploy.yml`.

## Project structure

| Path | Purpose |
|------|---------|
| `frontend/` | Vite site, styles, motion, `public/assets/` |
| `worker/` | Worker API (`/api/health`, `/api/profile`, `/api/contact`) |
| `wrangler.jsonc` | Worker name, static assets, observability |

## API

- `GET /api/health` — health check
- `GET /api/profile` — name, title, tagline, social links
- `POST /api/contact` — `{ name, email, message }`
