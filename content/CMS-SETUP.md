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
   `https://api.netlify.com/auth/done`  
   (Netlify’s public bridge — works even though the site is on Cloudflare Workers.)
5. Copy **Client ID** and generate **Client secret**.

### B. Netlify (free OAuth bridge only)

You do **not** need to host the site on Netlify. You only use their auth endpoint:

1. Sign in at https://app.netlify.com
2. **User settings** → **Applications** → **New access token** (for CLI) — optional
3. For Decap + `base_url: https://api.netlify.com`, the OAuth app above is enough; login uses Netlify’s shared auth handler.

If login fails, use the **self-hosted proxy** in section 4.

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

## 4. Optional: Cloudflare OAuth proxy (private repo / no Netlify)

Deploy [decap-proxy](https://github.com/sterlingwes/decap-proxy) as its own Worker (e.g. `cms-auth.chaoticstudio.workers.dev`), then change `config.yml`:

```yaml
backend:
  name: github
  repo: CHAOTIC-RAY/portfolio
  branch: main
  base_url: https://cms-auth.chaoticstudio.workers.dev
  auth_endpoint: auth
```

Set Worker secrets: `GITHUB_OAUTH_ID`, `GITHUB_OAUTH_SECRET`, and callback URL  
`https://cms-auth.chaoticstudio.workers.dev/callback` on the GitHub OAuth app.

See `cms-proxy/README.md` in this repo for a short checklist.

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
