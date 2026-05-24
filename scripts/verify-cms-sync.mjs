#!/usr/bin/env node
/**
 * Ensures GitHub/CMS source files stay in sync with what the live site build uses.
 * Run: node scripts/verify-cms-sync.mjs
 * Fix:  node scripts/verify-cms-sync.mjs --fix
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const fix = process.argv.includes("--fix");
const checkDist = process.argv.includes("--dist");

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function filesEqual(a, b) {
  const pa = path.join(root, a);
  const pb = path.join(root, b);
  if (!fs.existsSync(pa) || !fs.existsSync(pb)) return false;
  const ba = fs.readFileSync(pa);
  const bb = fs.readFileSync(pb);
  return ba.equals(bb);
}

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

/** Pairs that must be byte-identical before deploy (CMS edits content/, build copies to public/). */
const MIRROR_PAIRS = [
  ["content/campaign-posts.json", "frontend/public/content/campaign-posts.json"],
];

/** Every path Decap CMS commits to on GitHub (from config.yml). */
const CMS_REPO_FILES = [
  "content/campaign-posts.json",
  "content/portfolio.json",
  "content/chaos-studio.json",
  "frontend/public/assets/site.config.json",
];

function verifyMirrors() {
  for (const [src, dest] of MIRROR_PAIRS) {
    if (!fs.existsSync(path.join(root, src))) {
      fail(`Missing CMS source file: ${src}`);
      continue;
    }
    if (!fs.existsSync(path.join(root, dest))) {
      fail(`Missing site mirror: ${dest} (run: npm run sync:content)`);
      continue;
    }
    if (!filesEqual(src, dest)) {
      fail(
        `Out of sync: ${src} ≠ ${dest}\n` +
          `  The admin saves to GitHub (${src}) but the site reads ${dest} until build syncs.\n` +
          `  Run: npm run sync:cms  (or npm run verify:cms-sync --fix)`,
      );
    }
  }
}

function verifyCmsConfigPaths() {
  const configPath = "frontend/public/admin/config.yml";
  if (!fs.existsSync(path.join(root, configPath))) {
    fail(`Missing ${configPath}`);
    return;
  }
  const yaml = readText(configPath);
  const fileRefs = [...yaml.matchAll(/^\s+file:\s+(.+)\s*$/gm)].map((m) => m[1].trim());
  for (const rel of fileRefs) {
    if (!fs.existsSync(path.join(root, rel))) {
      fail(`CMS config points to missing file: ${rel}`);
    }
  }
}

function verifyCmsSourceFiles() {
  for (const rel of CMS_REPO_FILES) {
    if (!fs.existsSync(path.join(root, rel))) {
      fail(`Missing CMS-editable file: ${rel}`);
    }
  }
  try {
    const portfolio = JSON.parse(readText("content/portfolio.json"));
    if (portfolio.chaosStudio != null) {
      fail("content/portfolio.json must not contain chaosStudio — use content/chaos-studio.json");
    }
  } catch {
    fail("content/portfolio.json is invalid JSON");
  }
}

function manifestFingerprint(rel) {
  const data = JSON.parse(readText(rel));
  const paths = data.files.map((f) => f.path).sort();
  return JSON.stringify({ total: data.total, paths });
}

function verifyMediaManifest() {
  const manifestRel = "frontend/public/admin/media-manifest.json";
  if (!fs.existsSync(path.join(root, manifestRel))) {
    fail(`Missing ${manifestRel} (run: npm run media:manifest)`);
    return;
  }
  const committedFp = manifestFingerprint(manifestRel);
  const tmpRel = "frontend/public/admin/.media-manifest-check.json";
  const tmpAbs = path.join(root, tmpRel);
  const env = { ...process.env, CMS_MANIFEST_OUT: tmpAbs };
  const r = spawnSync("node", ["scripts/generate-media-manifest.mjs"], {
    cwd: root,
    stdio: "pipe",
    env,
  });
  if (r.status !== 0 || !fs.existsSync(tmpAbs)) {
    fail("Could not regenerate media manifest for verification");
    return;
  }
  const freshFp = manifestFingerprint(tmpRel);
  fs.unlinkSync(tmpAbs);
  if (committedFp !== freshFp) {
    fail(
      `media-manifest.json is stale (image list does not match disk).\n` +
        `  Run: npm run media:manifest  (included in npm run sync:cms)`,
    );
  }
}

function verifyAdminBundle() {
  const required = ["index.html", "config.yml", "cms-custom.css", "cms-custom.js", "media-manifest.json"];
  for (const f of required) {
    const rel = `frontend/public/admin/${f}`;
    if (!fs.existsSync(path.join(root, rel))) {
      fail(`Missing admin asset: ${rel}`);
    }
  }
}

function verifyDistAdminIfPresent() {
  const distAdmin = path.join(root, "frontend/dist/admin");
  if (!fs.existsSync(distAdmin)) return;
  for (const f of ["config.yml", "cms-custom.js", "media-manifest.json"]) {
    if (!filesEqual(`frontend/public/admin/${f}`, `frontend/dist/admin/${f}`)) {
      fail(`frontend/dist/admin/${f} is out of sync with frontend/public/admin/${f} — rebuild required`);
    }
  }
}

function writeSyncStatus() {
  const status = {
    checkedAt: new Date().toISOString(),
    branch: "main",
    ok: errors.length === 0,
    mirrors: MIRROR_PAIRS.map(([src, dest]) => ({
      source: src,
      mirror: dest,
      inSync: filesEqual(src, dest),
    })),
    cmsFiles: CMS_REPO_FILES.map((f) => ({ path: f, exists: fs.existsSync(path.join(root, f)) })),
  };
  const out = path.join(root, "frontend/public/admin/sync-status.json");
  fs.writeFileSync(out, `${JSON.stringify(status, null, 2)}\n`);
}

function runFix() {
  console.log("Fixing CMS sync (copy content → public, refresh media manifest)…");
  const r = spawnSync("node", ["scripts/sync-cms.mjs"], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  if (fix) runFix();

  verifyMirrors();
  verifyCmsConfigPaths();
  verifyCmsSourceFiles();
  verifyMediaManifest();
  verifyAdminBundle();

  if (checkDist) verifyDistAdminIfPresent();

  writeSyncStatus();

  if (warnings.length) {
    console.warn("CMS sync warnings:");
    warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  }

  if (errors.length) {
    console.error("CMS sync check failed:\n");
    errors.forEach((e) => console.error(`  ✗ ${e}\n`));
    console.error("Fix locally:  npm run sync:cms\n");
    process.exit(1);
  }

  console.log("CMS sync check passed (GitHub content ↔ site mirrors ↔ admin assets).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
