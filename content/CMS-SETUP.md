# Git-based CMS (Decap CMS)

Edit portfolio text, campaign posts, and images through a browser UI. Changes are saved as **commits to GitHub**; deploy runs automatically on `main`.

**Admin URL (after deploy):** https://portfolio.chaoticstudio.workers.dev/admin/

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

**Do not use** `https://api.netlify.com` — that only works for sites hosted on Netlify and returns “Not Found” for Workers domains.

### C. Repo access

Your GitHub user must have **write** access to `CHAOTIC-RAY/portfolio`.

---

## 2. What you can edit

| Collection | File | Use for |
|------------|------|--------|
| **Campaign & feed** | `content/campaign-posts.json` | Post titles, tags, clients, carousels, reels |
| **Portfolio page** | `content/portfolio.json` | Hero, experience, skills, Chaos Studio packages, contact |
| **Site assets config** | `frontend/public/assets/site.config.json` | Meta title/description, work card covers |

### Images

- In the CMS sidebar: **Media** uploads go to `frontend/public/images/posts/`.
- **Post ID** in JSON must match the folder/file name (e.g. `rainbow-01` → `images/posts/rainbow-01/` or `rainbow-01.webp`).
- After adding images, commit via CMS; GitHub Actions builds and deploys.

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
2. Confirm `GITHUB_OAUTH_ID` and `GITHUB_OAUTH_SECRET` are set in repo Actions secrets
3. Re-run **Deploy Worker** and try `/admin/` in a private/incognito window

---

## 5. After you publish in the CMS

1. Decap commits to `main` on GitHub.
2. **Deploy Worker** workflow runs (`npm run build` → Cloudflare).
3. Site updates in ~1–2 minutes.

Hard-refresh the live site if you still see old copy (PWA cache).

---

## 6. Regenerating `portfolio.json` from code

If you change `worker/src/data/portfolio.ts` by hand (not recommended):

```bash
node scripts/export-portfolio-json.mjs
```

Normal workflow: edit **`content/portfolio.json`** only via CMS or git.
