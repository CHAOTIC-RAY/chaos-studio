# Site split reference (chaos-studio repo)

This branch is the **Chaos Studio-only** codebase. The Ibrahim Wafig portfolio lives in `CHAOTIC-RAY/portfolio` (see PR on branch `cursor/split-portfolio-studio-cd99`).

| Site | Worker name | workers.dev host |
|------|-------------|------------------|
| Ibrahim portfolio | `portfolio` | `portfolio.chaoticstudio.workers.dev` |
| Chaos Studio | `design` | `design.chaoticstudio.workers.dev` |

## Push to new GitHub repo

```bash
git push -u origin chaos-studio-split
# On GitHub: create repo CHAOTIC-RAY/chaos-studio
git remote add studio git@github.com:CHAOTIC-RAY/chaos-studio.git
git push studio chaos-studio-split:main
```

## Deploy

```bash
npm install
npm run build
wrangler deploy
```

No CMS worker is bundled here yet; edit JSON under `content/` or add Sveltia later.
