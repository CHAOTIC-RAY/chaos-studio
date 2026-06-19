#!/usr/bin/env node
/** Build standalone Chaos Studio CMS app → cms/dist */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "cms/public");
const distDir = path.join(root, "cms/dist");
const buildId =
  process.env.CMS_BUILD_ID ||
  new Date().toISOString().replace(/[:-]/g, "").slice(0, 14);

const decapSrc = path.join(root, "node_modules/decap-cms/dist/decap-cms.js");
if (!fs.existsSync(decapSrc)) {
  console.error("decap-cms not installed — run npm ci");
  process.exit(1);
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.cpSync(publicDir, distDir, { recursive: true });

fs.copyFileSync(decapSrc, path.join(distDir, "decap-cms.js"));

const iconsSrc = path.join(root, "frontend/public/icons");
fs.cpSync(iconsSrc, path.join(distDir, "icons"), { recursive: true });

let index = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
index = index.replace(
  /(\/(?:cms-app|cms-hooks|cms-assistant|decap-cms)\.js)("|')/g,
  `$1?v=${buildId}$2`,
);
index = index.replace(
  /(\/(?:cms-app|cms-assistant|editor-frame)\.css)("|')/g,
  `$1?v=${buildId}$2`,
);
fs.writeFileSync(path.join(distDir, "index.html"), index);

fs.writeFileSync(
  path.join(distDir, "build-id.json"),
  `${JSON.stringify({ id: buildId, builtAt: new Date().toISOString() }, null, 2)}\n`,
);

const manifestOut = path.join(distDir, "media-manifest.json");
const r1 = spawnSync("node", ["scripts/generate-media-manifest.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, CMS_MANIFEST_OUT: manifestOut },
});
if (r1.status !== 0) process.exit(r1.status ?? 1);

const r2 = spawnSync("node", ["scripts/sync-content.mjs"], { cwd: root, stdio: "inherit" });
if (r2.status !== 0) process.exit(r2.status ?? 1);

const r3 = spawnSync("node", ["scripts/verify-cms-sync.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, CMS_SYNC_STATUS_OUT: path.join(distDir, "sync-status.json") },
});
if (r3.status !== 0) process.exit(r3.status ?? 1);

console.log(`CMS build complete → cms/dist (build ${buildId})`);

/** Mirror CMS into portfolio assets so /admin works on portfolio.chaoticstudio.workers.dev */
const ADMIN_BASE = "/admin";
const portfolioAdminDir = path.join(root, "frontend", "dist", "admin");

function prefixRootPaths(text, base = ADMIN_BASE) {
  return text.replace(/(\s(?:href|src|content)=["'])\/(?!\/)/g, `$1${base}/`);
}

function syncCmsToPortfolioAdmin() {
  const frontendDist = path.join(root, "frontend", "dist");
  if (!fs.existsSync(path.join(frontendDist, "index.html"))) {
    console.warn("Skip portfolio /admin sync — frontend/dist not built yet");
    return;
  }

  fs.rmSync(portfolioAdminDir, { recursive: true, force: true });
  fs.cpSync(distDir, portfolioAdminDir, { recursive: true });

  const indexPath = path.join(portfolioAdminDir, "index.html");
  fs.writeFileSync(indexPath, prefixRootPaths(fs.readFileSync(indexPath, "utf8")));

  const editorFramePath = path.join(portfolioAdminDir, "editor-frame.html");
  let editorFrame = fs.readFileSync(editorFramePath, "utf8");
  editorFrame = editorFrame.replace('location.replace("/"', `location.replace("${ADMIN_BASE}/"`);
  editorFrame = editorFrame.replace('href="/"', `href="${ADMIN_BASE}/"`);
  fs.writeFileSync(editorFramePath, editorFrame);

  const appPath = path.join(portfolioAdminDir, "cms-app.js");
  let appJs = fs.readFileSync(appPath, "utf8");
  appJs = appJs.replace(
    'const MANIFEST = "/media-manifest.json";',
    `const MANIFEST = "${ADMIN_BASE}/media-manifest.json";`,
  );
  appJs = appJs.replace(
    'const SYNC_URL = "/sync-status.json";',
    `const SYNC_URL = "${ADMIN_BASE}/sync-status.json";`,
  );
  appJs = appJs.replace(
    'navigator.serviceWorker.register("/sw.js", { scope: "/" })',
    `navigator.serviceWorker.register("${ADMIN_BASE}/sw.js", { scope: "${ADMIN_BASE}/" })`,
  );
  appJs = prefixRootPaths(appJs);
  fs.writeFileSync(appPath, appJs);

  const manifestPath = path.join(portfolioAdminDir, "manifest.webmanifest");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.id = `${ADMIN_BASE}/`;
  manifest.start_url = `${ADMIN_BASE}/`;
  manifest.scope = `${ADMIN_BASE}/`;
  for (const icon of manifest.icons ?? []) {
    if (icon.src?.startsWith("/")) icon.src = `${ADMIN_BASE}${icon.src}`;
  }
  for (const shortcut of manifest.shortcuts ?? []) {
    if (shortcut.url?.startsWith("/")) shortcut.url = `${ADMIN_BASE}${shortcut.url}`;
    for (const icon of shortcut.icons ?? []) {
      if (icon.src?.startsWith("/")) icon.src = `${ADMIN_BASE}${icon.src}`;
    }
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Synced CMS → frontend/dist/admin for ${ADMIN_BASE}/ on portfolio`);
}

syncCmsToPortfolioAdmin();
