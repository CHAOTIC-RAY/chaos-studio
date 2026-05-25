# Git-based CMS (Decap CMS)

Edit portfolio text, campaign posts, and images through a browser UI. Changes are saved as **commits to GitHub**; deploy runs automatically on `main`.

**Admin URL (after deploy):** https://portfolio.chaoticstudio.workers.dev/admin/

### Mobile & install (PWA)

On a phone, open the admin URL in **Safari** (iOS) or **Chrome** (Android):

- **iOS:** Share → **Add to Home Screen**
- **Android:** Menu → **Install app** (or use the in-app **Install** banner)

The CMS runs as a standalone app (`/admin/` scope) with a bottom tab bar, slide-out menu, and touch-friendly fields. Offline: shell and styles are cached; login and publish still need network.

---

## 1. One-time setup

### A. GitHub OAuth App

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. **Application name:** `Portfolio Decap CMS`
3. **Homepage URL:** `https://portfolio.chaoticstudio.workers.dev`
4. **Authorization callback URL:**  
   `https://cms-auth.chaoticstudio.workers.dev/callback?provider=github`
5. Copy **Client ID** and generate **Client secret**.

### B. GitHub Actions secrets (CMS login)

In the repo → **Settings** → **Secrets and variables** → **Actions**, add:

| Name | Value |
|------|--------|
| `CMS_OAUTH_CLIENT_ID` | OAuth Client ID |
| `CMS_OAUTH_CLIENT_SECRET` | OAuth Client secret |

(GitHub forbids secret names starting with `GITHUB_`.)

Push to `main` (or re-run **Deploy Worker**). The workflow deploys the `cms-auth` worker in `cms-proxy/` with these secrets.

The repo is **private**, so OAuth uses the `repo` scope. After deploy, log out of `/admin/` and **Login with GitHub** again so the new permissions apply.

**Do not use** `https://api.netlify.com` — that only works for sites hosted on Netlify and returns “Not Found” for Workers domains.

### C. Repo access

Your GitHub user must have **write** access to `CHAOTIC-RAY/portfolio`.

---

## 2. What you can edit

| Collection | File | Use for |
|------------|------|--------|
| **Campaign heading** | `content/campaign-meta.json` | Subtitle under Campaign on the home page |
| **Social posts** | `content/campaign-posts.json` | Post titles, tags, clients, carousels, reels |
| **Chaos Studio tab** | `content/chaos-studio.json` | Studio page — packages, pricing, services, contact |
| **Site content** | `content/portfolio.json` | Home page — profile, experience, skills, contact |
| **SEO & projects** | `frontend/public/assets/site.config.json` | Meta, social links, work cards, client logos |

See **`content/CMS-TROUBLESHOOTING.md`** for save/deploy errors and fixes.

### Images

- **Media** tab (built-in): shows only files in the **root** of `frontend/public/images/posts/` (~35 uploads).
- **All post images** panel (top of Media tab): shows **every** image including subfolders (`rainbow-01/slide-02.webp`, etc.). Click an image to copy its path for CMS fields.
- Carousel / multi-slide posts: put files in `frontend/public/images/posts/{post-id}/` (e.g. `slide-01.webp`, `slide-02.webp`).
- Single-image posts: `frontend/public/images/posts/{post-id}.webp` at the root.
- **Post ID** in JSON must match the folder or file name.
- After adding images, publish in CMS; GitHub Actions builds and deploys.

### Optional: `post-copy.json`

Legacy batch overrides used by `npm run apply:post-copy`. Prefer editing **Campaign & feed** in the CMS. If you still edit `content/post-copy.json` by hand, run:

```bash
npm run apply:post-copy
```

---

## 3. Local preview (no GitHub login)

```bash
npm install
npx decap-server
```

In `frontend/public/admin/config.yml`, uncomment:

```yaml
local_backend: true
```

Open http://localhost:8080/admin/ (decap-server prints the port). Edits commit to your local git repo.

---

## 4. CMS OAuth proxy (already in repo)

The `cms-proxy/` worker (`cms-auth`) is deployed from GitHub Actions. Details: `cms-proxy/README.md`.

If login still fails:

1. Confirm OAuth callback is exactly  
   `https://cms-auth.chaoticstudio.workers.dev/callback?provider=github`
2. Confirm `CMS_OAUTH_CLIENT_ID` and `CMS_OAUTH_CLIENT_SECRET` are set in repo Actions secrets
3. Re-run **Deploy Worker** and try `/admin/` in a private/incognito window

---

## 5. After you publish in the CMS

1. Decap commits to `main` on GitHub.
2. **Deploy Worker** workflow runs (`npm run build` → Cloudflare).
3. Site updates in ~1–2 minutes.

Hard-refresh the live site if you still see old copy (PWA cache).

CI runs `npm run validate:cms` and `npm run verify:cms-sync` before build — broken JSON or out-of-sync mirrors fail deploy.

### Staying in sync

| What | Where |
|------|--------|
| CMS saves to GitHub | `content/*.json`, `frontend/public/assets/site.config.json` |
| Site reads posts from | `frontend/public/content/campaign-posts.json` (copied at build) |
| Check locally | `npm run verify:cms-sync` |
| Fix mirrors | `npm run sync:cms` |

The admin header shows **In sync with GitHub** when mirrors match. After you Publish in CMS, wait ~2 minutes for deploy.

---

## 6. Regenerating `portfolio.json` from code

If you change `worker/src/data/portfolio.ts` by hand (not recommended):

```bash
node scripts/export-portfolio-json.mjs
```

Normal workflow: edit **`content/portfolio.json`** only via CMS or git.

---

## 7. AI site assistant (cloud models)

**URL:** https://portfolio.chaoticstudio.workers.dev/admin/#/assistant

Chat with **Claude, GPT, Gemini, or Groq** to change site copy, posts, studio text, and SEO. Attach `.json`, `.md`, or `.txt` files as briefs. When the model proposes changes, click **Apply to GitHub** — same flow as Publish (commit to `main`, deploy ~2 min).

### Recommended setup

1. **[OpenRouter](https://openrouter.ai/keys)** — one API key, switch models in the admin dropdown (default: **Gemini 2.0 Flash**).
2. **GitHub access** — log into the CMS with GitHub, or paste a PAT (repo scope) in AI Settings.

Other providers (each needs its own key in Settings):

| Provider | Get a key |
|----------|-----------|
| OpenAI | https://platform.openai.com/api-keys |
| Anthropic | https://console.anthropic.com/settings/keys |
| Google Gemini | https://aistudio.google.com/apikey |
| Groq | https://console.groq.com/keys |

### Optional: worker secrets (no key in browser)

Set on the Cloudflare Worker (Wrangler secrets) so the admin can call AI without storing a key locally:

- `OPENROUTER_API_KEY` (recommended)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_API_KEY`
- `GROQ_API_KEY`
- or generic `AI_API_KEY` as fallback

Files the AI can update: `content/campaign-meta.json`, `content/campaign-posts.json`, `content/portfolio.json`, `content/chaos-studio.json`, `frontend/public/assets/site.config.json`.
