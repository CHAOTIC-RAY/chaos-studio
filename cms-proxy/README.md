# Decap CMS OAuth proxy (optional)

Use this if the Netlify auth bridge (`base_url: https://api.netlify.com`) does not work for your repo (e.g. private repo or stricter OAuth).

## Steps

1. Fork or clone https://github.com/sterlingwes/decap-proxy
2. Create a GitHub OAuth App with callback  
   `https://<your-proxy-worker>.workers.dev/callback`
3. Deploy the Worker with secrets `GITHUB_OAUTH_ID` and `GITHUB_OAUTH_SECRET`
4. In `frontend/public/admin/config.yml`, set:

```yaml
backend:
  name: github
  repo: CHAOTIC-RAY/portfolio
  branch: main
  base_url: https://<your-proxy-worker>.workers.dev
  auth_endpoint: auth
```

5. Remove or comment out `base_url: https://api.netlify.com` / `auth_endpoint: auth` lines.

Do not deploy the OAuth proxy on the same Worker as the public portfolio unless you know how to route `/auth` separately.
