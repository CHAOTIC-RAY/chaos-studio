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
