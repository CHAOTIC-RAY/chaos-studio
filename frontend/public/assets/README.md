# Portfolio assets

Replace images here without changing code. After editing, run `npm run build` from the repo root (or push to `main` to deploy).

## Brand logos

| File | Use |
|------|-----|
| `brand/logo.svg` | Header logo (full wordmark) |
| `brand/logo-mark.svg` | Compact icon / mobile |
| `brand/favicon/favicon.svg` | Browser tab icon |

Recommended: SVG for logos. Keep header logo height around 32–40px.

## About

| File | Use |
|------|-----|
| `about/portrait.svg` | About section photo |

Recommended: WebP or JPG, **800×1000** (4:5). Update path in `site.config.json` if you use a different filename.

## Projects

1. Create a folder: `work/your-project-slug/`
2. Add `cover.webp` (or `.svg` / `.jpg`) — name can vary if you update `site.config.json`
3. Optional: `cover-hover.webp` for hover swap
4. Add an entry to `site.config.json` under `work`

Default cover if missing: `work/_placeholders/default-cover.svg`

Recommended cover size: **1200×900** (4:3), WebP under ~300KB.

## Social preview

| File | Use |
|------|-----|
| `meta/og-image.svg` | Link preview (replace with **1200×630** JPG/WebP for production) |

## Clients (optional)

Add `clients/client-name.svg` and list in `site.config.json` → `clients`.

## Background

| File | Use |
|------|-----|
| `background/grain.svg` | Film grain overlay (tileable) |

## Config

Edit **`site.config.json`** for titles, alt text, links, and image paths.
