# Chaos Studio

Independent creative studio site for **Chaos Studio** (Malé, Maldives) — static v4 `/studio` and `/gallery` experience on Cloudflare Workers.

This tree is prepared as a **standalone repository**. Push branch `chaos-studio-split` to GitHub as `CHAOTIC-RAY/chaos-studio`.

## Local development

```bash
npm install
npm run dev
```

- Root `/` redirects to `/studio/`.
- Gallery loads live data from `GET /api/portfolio` with fallback to `gallery-snapshot.json`.

## Deploy (when ready — does not affect the live combined worker until you run this)

```bash
npm run build
wrangler deploy
```

**Worker name:** `chaos-studio` → [https://chaos-studio.chaoticstudio.workers.dev](https://chaos-studio.chaoticstudio.workers.dev)

**Portfolio cross-link:** Studio/gallery nav includes [Ibrahim Wafig's portfolio](https://portfolio.chaoticstudio.workers.dev).

## Content

| File | Purpose |
|------|---------|
| `content/chaos-studio.json` | Studio page copy & packages |
| `content/gallery.json` | Gallery page headings |
| `content/social-posts.json` | Feed / gallery items |
| `content/gallery-posts.json` | Gallery-priority posts |
| `content/portfolio.json` | Profile context for gallery API (duplicated from personal portfolio repo) |

## Split from `portfolio` monorepo

See [`docs/SITE-SPLIT.md`](docs/SITE-SPLIT.md) in the Ibrahim Wafig portfolio repo for shared history, CMS notes, and cutover steps.
