# Chaos Studio

**Chaos Studio** (Malé, Maldives) — branding, social campaigns, jerseys, and product design.  
Public site: studio landing at `/studio/`, client work gallery at `/gallery/`, served from **Cloudflare Workers** with static assets and a small TypeScript worker for the gallery API.

| Route | What it is |
|-------|------------|
| `/` | Redirects to `/studio/` |
| `/studio/` | Studio packages, services, contact |
| `/gallery/` | Filterable work wall (live JSON + offline snapshot) |
| `/gallery/<slug>` | Deep link into a project (gallery shell) |
| `GET /api/portfolio` | Posts and copy for the gallery client |

Cross-link: nav **Ibrahim** → [portfolio.chaoticstudio.workers.dev](https://portfolio.chaoticstudio.workers.dev).

## Requirements

- Node.js **20+**
- Cloudflare account (only for deploy; local dev needs no credentials)

## Local development

```bash
npm install
npm run dev
```

`npm run dev` runs a full build, then `wrangler dev` (default **http://127.0.0.1:8787**).

Build only:

```bash
npm run build
```

Output: `frontend/dist/` (static site + `gallery-snapshot.json`).

## Deploy to Cloudflare

**Worker name:** `design` (see `wrangler.jsonc`) → `https://design.chaoticstudio.workers.dev`

```bash
npm install
npm run build
npx wrangler deploy
```

Or: `npm run deploy` (build + deploy).

**Wrangler / dashboard**

- Build command: `npm run build` (or rely on `wrangler.jsonc` `build.command`)
- Deploy command: `npx wrangler deploy` or `npm run deploy`
- Assets: binding `ASSETS` → `./frontend/dist`
- `run_worker_first`: `/api/*`, `/gallery/*` (API + gallery deep links)

**Optional later:** custom domain (e.g. `chaosstudio.mv`) on worker `design`, env vars/secrets only if you add CMS or auth.

This repo does **not** include the Ibrahim portfolio CMS; edit JSON under `content/` and campaign images under `frontend/public/images/posts/`, then rebuild.

## Content layout

| Path | Purpose |
|------|---------|
| `content/chaos-studio.json` | Studio page copy, packages, contact |
| `content/gallery.json` | Gallery headings |
| `content/social-posts.json` | Campaign / feed posts |
| `content/gallery-posts.json` | Gallery-first posts |
| `content/campaign-meta.json` | Feed section subtitle |
| `content/portfolio.json` | Profile context for `/api/portfolio` (gallery snapshot shape) |

`npm run sync:content` mirrors post JSON into `frontend/public/content/` before build.

## Repository layout

```
worker/           # Cloudflare Worker (API + routing)
frontend/public/  # Source static files (studio, gallery, cs, images)
frontend/dist/    # Build output (generated; deployed assets)
scripts/          # build, pano thumbs, content sync
content/          # Editable JSON
```

## Split from the portfolio monorepo

This project was split from [CHAOTIC-RAY/portfolio](https://github.com/CHAOTIC-RAY/portfolio). Cutover notes: [docs/SITE-SPLIT.md](docs/SITE-SPLIT.md).
