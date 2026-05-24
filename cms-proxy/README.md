# Decap CMS GitHub OAuth proxy

Decap CMS on Cloudflare Workers cannot use `https://api.netlify.com` for login unless the site is registered on Netlify. This worker handles GitHub OAuth for `/admin/`.

**Public URL:** https://cms-auth.chaoticstudio.workers.dev

## One-time setup

### 1. GitHub OAuth App

GitHub → **Settings** → **Developer settings** → **OAuth Apps** → create or edit your app:

| Field | Value |
|-------|--------|
| Homepage URL | `https://portfolio.chaoticstudio.workers.dev` |
| Authorization callback URL | `https://cms-auth.chaoticstudio.workers.dev/callback?provider=github` |

Copy **Client ID** and **Client secret**.

### 2. GitHub Actions secrets

In **CHAOTIC-RAY/portfolio** → **Settings** → **Secrets and variables** → **Actions**, add:

| Secret | Value |
|--------|--------|
| `CMS_OAUTH_CLIENT_ID` | OAuth App Client ID |
| `CMS_OAUTH_CLIENT_SECRET` | OAuth App Client secret |

GitHub Actions does not allow secret names starting with `GITHUB_`.

The deploy workflow uploads these to the `cms-auth` worker automatically.

### 3. Deploy

Push to `main` (or run **Deploy Worker**). The workflow deploys this worker after the portfolio site.

### 4. Log in

Open https://portfolio.chaoticstudio.workers.dev/admin/ → **Login with GitHub**.

---

## Local deploy

```bash
cd cms-proxy
npx wrangler secret put GITHUB_OAUTH_ID
npx wrangler secret put GITHUB_OAUTH_SECRET
npx wrangler deploy
```

## Public repo only

If the repo is **public** and you want minimal OAuth scope, set worker secret `GITHUB_REPO_PUBLIC` to `1`.  
By default the proxy requests `repo` scope (required for private repos).
