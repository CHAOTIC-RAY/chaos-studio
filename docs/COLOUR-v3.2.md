# Chaos Studio site — v3.2 colour-token change (local copy only)

This is a **local copy** of github.com/CHAOTIC-RAY/chaos-studio. No git commit, push, or deploy was made.

Source copied from `/workspace/cs-audit/chaos-studio/` (excluding `.git`).

Live site (unchanged): https://design.chaoticstudio.workers.dev

## What changed

- cs/base.css: :root tokens updated to v3.2 (with v3.1 aliases)
- cs/base.css: .skip → cream/ink (AA any size); .hpill 24px ink on cherry (AA large)
- cs/brand-v3-2026.css: :root tokens updated to v3.2
- edge.css: 214,144,232 → 185,159,218 (1x)
- edge.css: 193,107,224 → 148,112,219 (1x)
- edge.css: rgba(212,245,74,.85) → rgba(231,45,73,.85) (1x)
- v3-hyper.css: 214, 144, 232 → 185, 159, 218 (2x)
- contact-chrome.css: 214, 144, 232 → 185, 159, 218 (5x)
- contact-chrome.css: #9bff4a → var(--vanilla-cream) (1x)
- studio.css: #7a2f99 → #3F3455 (2x)
- brand-v3-2026.css: 214, 144, 232 → 185, 159, 218 (2x)
- gallery.css: #EDE6DA → #FFF5D9 (2x)
- showcase-devices.css: 214, 144, 232 → 185, 159, 218 (2x)
- showcase-devices.css: 193, 107, 224 → 148, 112, 219 (1x)
- base.css: 214,144,232 → 185,159,218 (1x)
- v3-studio-bento.css: 214, 144, 232 → 185, 159, 218 (3x)
- app.js: 214,144,232 → 185,159,218 (1x)
- app.js: 193,107,224 → 148,112,219 (1x)
- dot-matrix-text.js: #d690e8 → #B99FDA (1x)
- hero-generative.js: 214, 144, 232 → 185, 159, 218 (1x)
- hero-generative.js: 193, 107, 224 → 148, 112, 219 (1x)
- hero-generative.js: 193,107,224 → 148,112,219 (1x)
- hero-generative.js: #ede6da → #fff5d9 (2x)
- hero-generative.js: #d690e8 → #B99FDA (2x)
- hero-generative.js: #c16be0 → #9470DB (4x)
- hero-generative.js: #ff4444 → #E72D49 (6x)
- hero-generative.js: #28122c → #3F3455 (2x)
- hero-generative.js: #a79a89 → #FFF5D9 (1x)
- cs/contact-chrome.css: primary CTA ink on cherry at 19px/700 (AA large); hover cream/ink
- favicon.svg: #4e1370 → #3F3455 (1x)
- favicon.svg: #e8a0f5 → #B99FDA (1x)
- pwa-icon.svg: #4e1370 → #3F3455 (1x)
- pwa-icon.svg: #e8a0f5 → #B99FDA (1x)
- pwa-icon-maskable.svg: #4e1370 → #3F3455 (1x)
- pwa-icon-maskable.svg: #e8a0f5 → #B99FDA (1x)
- assets/brand/favicon/favicon.svg: #4e1370 → #3F3455 (1x)
- assets/brand/favicon/favicon.svg: #e8a0f5 → #B99FDA (1x)

## Not changed

- Client/project artwork, placeholders, and motif SVGs.
- macOS-style window chrome colours in `showcase-devices.css`.
- WhatsApp / Telegram channel tints (`#dfffe8`, `#d4ecff`) on header buttons.
- Admin UI (`admin/admin.css` still has its own lime/purple). Flagged for a follow-up.
- No deploy to `design.chaoticstudio.workers.dev` and no git push.

- cs/hero-generative.js, cs/app.js, cs/gallery.css: leftover plum RGB 40,18,44 → violet deep 63,52,85
