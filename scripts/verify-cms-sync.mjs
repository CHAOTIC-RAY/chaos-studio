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
  ["content/social-posts.json", "frontend/public/content/social-posts.json"],
  ["content/gallery-posts.json", "frontend/public/content/gallery-posts.json"],
  ["content/gallery.json", "frontend/public/content/gallery.json"],
];

function readCampaignPublicMerged() {
  const posts = JSON.parse(readText("content/social-posts.json"));
  const meta = JSON.parse(readText("content/campaign-meta.json"));
  return `${JSON.stringify({ subtitle: meta.subtitle, posts: posts.posts }, null, 2)}\n`;
}

/** Every path Sveltia CMS commits to on GitHub (from config.yml). */
const CMS_REPO_FILES = [
  "content/campaign-meta.json",
  "content/social-posts.json",
  "content/gallery-posts.json",
  "content/portfolio.json",
  "content/chaos-studio.json",
  "content/gallery.json",
  "frontend/public/assets/site.config.json",
];

function verifyMirrors() {
  const publicCampaign = "frontend/public/content/campaign-posts.json";
  if (!fs.existsSync(path.join(root, "content/campaign-meta.json"))) {
    fail("Missing content/campaign-meta.json");
  }
  if (!fs.existsSync(path.join(root, publicCampaign))) {
    fail(`Missing ${publicCampaign} (run: npm run sync:content)`);
  } else {
    const merged = readCampaignPublicMerged();
    const onDisk = fs.readFileSync(path.join(root, publicCampaign), "utf8");
    if (merged !== onDisk) {
      fail(
        `Out of sync: campaign meta+posts !== ${publicCampaign}\n` +
          `  Run: npm run sync:cms`,
      );
    }
  }

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
        `Out of sync: ${src} != ${dest}\n` +
          `  The admin saves to GitHub (${src}) but the site reads ${dest} until build syncs.\n` +
          `  Run: npm run sync:cms  (or npm run verify:cms-sync --fix)`,
      );
    }
  }
}

const CMS_PUBLIC = "cms/public";
const CMS_DIST = "cms/dist";

function verifyCmsConfigPaths() {
  const configPath = `${CMS_PUBLIC}/config.yml`;
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
      fail("content/portfolio.json must not contain chaosStudio - use content/chaos-studio.json");
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
  const manifestRel = `${CMS_DIST}/media-manifest.json`;
  if (!fs.existsSync(path.join(root, manifestRel))) {
    fail(`Missing ${manifestRel} (run: npm run build:cms)`);
    return;
  }
  const committedFp = manifestFingerprint(manifestRel);
  const tmpAbs = path.join(root, `${CMS_DIST}/.media-manifest-check.json`);
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
  const freshFp = manifestFingerprint(path.relative(root, tmpAbs));
  fs.unlinkSync(tmpAbs);
  if (committedFp !== freshFp) {
    fail(
      `media-manifest.json is stale (image list does not match disk).\n` +
        `  Run: npm run media:manifest  (included in npm run sync:cms)`,
    );
  }
}

function ensureCmsVendored() {
  const dest = `${CMS_DIST}/sveltia-cms.js`;
  if (fs.existsSync(path.join(root, dest))) return;
  const r = spawnSync("node", ["scripts/build-cms.mjs"], { cwd: root, stdio: "pipe" });
  if (r.status !== 0 || !fs.existsSync(path.join(root, dest))) {
    fail(`Missing CMS asset: ${dest}\n  Run: npm run build:cms`);
  }
}

function verifyCmsSourceBundle() {
  const required = [
    "index.html",
    "config.yml",
    "cms-app.css",
    "cms-app.js",
    "cms-hooks.js",
    "cms-assistant.js",
    "sw.js",
    "manifest.webmanifest",
  ];
  for (const f of required) {
    const rel = `${CMS_PUBLIC}/${f}`;
    if (!fs.existsSync(path.join(root, rel))) {
      fail(`Missing CMS source: ${rel}`);
    }
  }
}

function verifyDistCmsIfPresent() {
  const distDir = path.join(root, CMS_DIST);
  if (!fs.existsSync(distDir)) return;
  const required = [
    "index.html",
    "config.yml",
    "sveltia-cms.js",
    "cms-app.js",
    "media-manifest.json",
    "sync-status.json",
  ];
  for (const f of required) {
    const rel = `${CMS_DIST}/${f}`;
    if (!fs.existsSync(path.join(root, rel))) {
      fail(`Missing CMS build output: ${rel}`);
    }
  }
  for (const f of ["config.yml", "cms-app.js"]) {
    if (!filesEqual(`${CMS_PUBLIC}/${f}`, `${CMS_DIST}/${f}`)) {
      fail(`${CMS_DIST}/${f} is out of sync with ${CMS_PUBLIC}/${f} - run: npm run build:cms`);
    }
  }
}

function writeSyncStatus() {
  const status = {
    checkedAt: new Date().toISOString(),
    branch: "main",
    ok: errors.length === 0,
    mirrors: [
      {
        source: "content/campaign-meta.json + social-posts.json",
        mirror: "frontend/public/content/campaign-posts.json",
        inSync:
          fs.existsSync(path.join(root, "frontend/public/content/campaign-posts.json")) &&
          readCampaignPublicMerged() ===
            fs.readFileSync(path.join(root, "frontend/public/content/campaign-posts.json"), "utf8"),
      },
      ...MIRROR_PAIRS.map(([src, dest]) => ({
        source: src,
        mirror: dest,
        inSync: filesEqual(src, dest),
      })),
    ],
    cmsFiles: CMS_REPO_FILES.map((f) => ({ path: f, exists: fs.existsSync(path.join(root, f)) })),
  };
  const out =
    process.env.CMS_SYNC_STATUS_OUT || path.join(root, CMS_DIST, "sync-status.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(status, null, 2)}\n`);
}

function runFix() {
  console.log("Fixing CMS sync (content mirrors + CMS build)...");
  const r = spawnSync("node", ["scripts/build-cms.mjs"], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  if (fix) runFix();

  verifyMirrors();
  verifyCmsConfigPaths();
  verifyCmsSourceFiles();
  if (checkDist) {
    verifyDistCmsIfPresent();
    verifyMediaManifest();
    ensureCmsVendored();
  } else {
    verifyCmsSourceBundle();
  }

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

  console.log("CMS sync check passed (GitHub content ↔ site mirrors ↔ CMS app).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});