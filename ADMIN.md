# Chaos Studio CMS (`design` worker)

## Login

- URL: `/admin/`
- Password: Cloudflare Worker secret `ADMIN_PASSWORD` (not stored in the repo).

## Deploy

Infra is pre-provisioned on Cloudflare. From the repo root:

```bash
npm run build
npx wrangler deploy
```

Bindings in `wrangler.jsonc`:

| Binding | Resource |
|--------|-----------|
| `CONTENT` | KV `cs-content` (`cd318685a7f14897ac4b8960ac8f6a03`) |
| `MEDIA` | R2 `cs-media` |
| `ADMIN_PASSWORD` / `SESSION_SECRET` | Worker secrets (already set) |

## Public content API

- `GET /api/content` — live site JSON (falls back to bundled defaults in the browser if unavailable)
- `PUT /api/content` — save (session required)
- `POST /api/content/restore-defaults` — reset from `content/site-content.defaults.json` seed
- `GET /api/content/history` — last 10 versions (session)
- `POST /api/content/restore` — body `{ "savedAt": "<iso>" }` (session)
- `POST /api/media/upload` — multipart field `file` (session)

## Content schema

Single document (`SiteContent`), seed: `content/site-content.defaults.json`.

Top-level keys: `seo`, `hero`, `contact`, `services[]`, `packages[]`, `pricingNote`, `whyUs[]`, `featuredWork[]`, `showcaseHeadline`, `footer`, `about`, `finale`.

See TypeScript types in `worker/src/content/types.ts`.
