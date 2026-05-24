#!/usr/bin/env node
/**
 * Guardrails before deploy: JSON shapes must match what the site + Decap CMS expect.
 * Run: node scripts/validate-cms-schema.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function readJson(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) throw new Error(`Missing ${rel}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function isStringArray(v, label) {
  assert(Array.isArray(v), `${label} must be an array`);
  assert(v.every((x) => typeof x === "string"), `${label} must be string[] (not {tag:…} objects)`);
}

function validateCampaign() {
  const data = readJson("content/campaign-posts.json");
  assert(typeof data.subtitle === "string", "campaign-posts: subtitle");
  assert(Array.isArray(data.posts), "campaign-posts: posts");
  for (const p of data.posts) {
    assert(typeof p.id === "string" && p.id, `post missing id`);
    isStringArray(p.tags ?? [], `post ${p.id} tags`);
    if (p.slides != null) isStringArray(p.slides, `post ${p.id} slides`);
    if (p.tags?.some((t) => typeof t === "object")) {
      throw new Error(`post ${p.id}: tags look like CMS objects — use string tags only`);
    }
  }
}

function validatePortfolio() {
  const data = readJson("content/portfolio.json");
  if (data.chaosStudio != null) {
    throw new Error(
      "portfolio.json must not contain chaosStudio — edit content/chaos-studio.json (Chaos Studio tab in CMS)",
    );
  }
  isStringArray(data.softSkills ?? [], "portfolio softSkills");
  for (const job of data.experience?.items ?? []) {
    isStringArray(job.bullets ?? [], `job ${job.id} bullets`);
  }
}

function validateChaosStudio() {
  const cs = readJson("content/chaos-studio.json");
  assert(typeof cs.title === "string", "chaos-studio: title");
  isStringArray(cs.highlights ?? [], "chaos-studio highlights");
  isStringArray(cs.services ?? [], "chaos-studio services");
  for (const pkg of cs.packages ?? []) {
    isStringArray(pkg.features ?? [], `package ${pkg.id} features`);
  }
}

function validateSiteConfig() {
  const data = readJson("frontend/public/assets/site.config.json");
  for (const key of ["brand", "about", "meta", "social", "work", "clients"]) {
    assert(data[key] != null, `site.config.json missing top-level "${key}" (CMS save may have wiped it)`);
  }
  assert(typeof data.meta?.title === "string", "site.config meta.title");
  assert(Array.isArray(data.work), "site.config work");
  assert(Array.isArray(data.clients), "site.config clients");
}

function validateAdminAssets() {
  const adminDir = path.join(root, "frontend/public/admin");
  for (const f of ["index.html", "config.yml", "cms-custom.css", "cms-custom.js", "media-manifest.json"]) {
    assert(fs.existsSync(path.join(adminDir, f)), `Missing frontend/public/admin/${f}`);
  }
  const manifest = readJson("frontend/public/admin/media-manifest.json");
  assert(Array.isArray(manifest.files) && manifest.files.length > 0, "media-manifest.json has no files");
}

try {
  validateCampaign();
  validatePortfolio();
  validateChaosStudio();
  validateSiteConfig();
  validateAdminAssets();
  console.log("CMS schema validation passed.");
} catch (e) {
  console.error("CMS schema validation failed:", e.message);
  process.exit(1);
}
