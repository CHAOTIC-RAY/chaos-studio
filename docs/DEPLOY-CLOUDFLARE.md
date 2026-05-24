# Fix GitHub Actions deploy (Cloudflare Workers)

If **Deploy Worker** fails with `Authentication error [code: 10000]` or `Authentication failed [code: 9106]`, the API token or Account ID in GitHub secrets is wrong or under-powered.

## 1. Get your Account ID

1. Open https://dash.cloudflare.com/
2. Go to **Workers & Pages**
3. Copy **Account ID** from the right sidebar (32-character hex)

## 2. Create a new API token (recommended)

1. https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → use template **Edit Cloudflare Workers**
3. Under **Account Resources**, ensure your account is included (All accounts or this account only)
4. Create and copy the token (shown once)

Required permissions (included in that template):

- Account → Workers Scripts → **Edit**
- Account → Workers KV / R2 / etc. if you add them later
- Account → Account Settings → **Read** (needed for wrangler account lookup)

Do **not** use a token that is **Read only** on Workers Scripts.

If the workflow passes **Verify Cloudflare API token** but fails on deploy with `code: 10000`, your token is valid for the account but **cannot edit Workers**. Delete the old GitHub secret and paste a **new** token from the **Edit Cloudflare Workers** template (do not reuse a read-only or custom token).

## 3. Add GitHub repository secrets

Repo: **CHAOTIC-RAY/portfolio** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Name | Value |
|------|--------|
| `CLOUDFLARE_API_TOKEN` | Token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from step 1 |

Names must match exactly (case-sensitive).

## 4. Re-run deploy

**Actions** → **Deploy Worker** → **Run workflow** → branch `main`

The workflow now:

1. Verifies secrets exist  
2. Calls Cloudflare **token verify** for your account  
3. Builds the site  
4. Runs `wrangler deploy` (skips duplicate build via `WRANGLER_SKIP_BUILD`)

## 5. Alternative: Cloudflare Workers Builds (no GitHub token)

If you prefer not to use GitHub secrets:

1. Cloudflare dashboard → **Workers & Pages** → your **portfolio** worker (or create one)
2. **Settings** → **Builds** → connect **CHAOTIC-RAY/portfolio** on `main`
3. **Build command:** `npm run build`  
4. **Deploy command:** `WRANGLER_SKIP_BUILD=1 npx wrangler deploy` (after build step)

Then disable or ignore the GitHub **Deploy Worker** workflow if Builds handles deploy.

## Local deploy

```bash
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
npm run build
WRANGLER_SKIP_BUILD=1 npx wrangler deploy
```
