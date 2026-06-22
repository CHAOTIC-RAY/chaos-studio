# CMS Publish Not Working - Troubleshooting Guide

If clicking "Publish" in the admin portal doesn't update GitHub main or trigger redeployment, follow these steps:

## Step 1: Check GitHub OAuth App Permissions

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Find your "Portfolio CMS" app
3. Verify the **Authorization callback URL** is exactly:
   `https://cms-auth.chaoticstudio.workers.dev/callback?provider=github`
4. Check that the app has the **repo** scope enabled (required for private repos)

## Step 2: Verify GitHub Actions Secrets

In your repo → Settings → Secrets and variables → Actions, ensure these are set:

| Secret | Required |
|--------|----------|
| `CMS_OAUTH_CLIENT_ID` | ✅ Yes |
| `CMS_OAUTH_CLIENT_SECRET` | ✅ Yes |
| `CLOUDFLARE_API_TOKEN` | ✅ Yes |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Yes |

If missing, add them and re-run the **Deploy Worker** workflow.

## Step 3: Check Branch Protection Rules

If `main` branch has protection rules requiring pull requests:

1. Go to repo → Settings → Branches
2. Find `main` branch protection rules
3. Either:
   - Disable protection for direct commits, OR
   - Add the OAuth app user/bot to the bypass list
4. The CMS needs to push directly to `main` (not via PR)

## Step 4: Re-authenticate in CMS

1. Open https://portfolio.chaoticstudio.workers.dev/admin/
2. Log out if already logged in
3. Click **Login with GitHub**
4. When prompted, approve the **repo** scope
5. Try publishing again

## Step 5: Check Browser Console for Errors

1. Open admin portal in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Click Publish
5. Look for errors like:
   - `403 Forbidden` - Permission issue
   - `Repo not found` - OAuth scope issue
   - `Failed to persist` - Write access issue

## Step 6: Verify OAuth Proxy is Deployed

1. Visit https://cms-auth.chaoticstudio.workers.dev
2. Should return a response (not 404/500)
3. If not deployed, re-run **Deploy Worker** workflow

## Step 7: Check GitHub Repo Access

Ensure your GitHub user has:
- **Write access** to `CHAOTIC-RAY/portfolio`
- Approved the OAuth app with **repo** scope
- If org repo, org access approval

## Quick Fix Sequence

```bash
# 1. Ensure secrets are set in GitHub Actions
# 2. Re-run Deploy Worker workflow
# 3. Log out and log back in to /admin/
# 4. Try publishing again
```

## Still Not Working?

Check the GitHub Actions log after attempting to publish:
- GitHub → Actions tab
- Look for "Deploy Worker" workflow runs
- If no new run appears, CMS isn't committing to GitHub
- If run appears but fails, check the error in the workflow log
