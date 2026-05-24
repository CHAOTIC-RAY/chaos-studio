#!/usr/bin/env node
/**
 * Guardrails before deploy: JSON shapes must match what Decap CMS + site expect.
 * CMS stores list fields as [{tag:"..."}] etc.; worker normalizes to string[] for the site.
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

function isCmsStringList(v, prop, label) {
  assert(Array.isArray(v), `${label} must be an array`);
  for (const item of v) {
    if (typeof item === "string") {
      throw new Error(`${label}: still plain strings — run: npm run migrate:cms-lists`);
    }
    assert(
      item && typeof item === "object" && typeof item[prop] === "string",
      `${label}: each item must be { "${prop}": "..." }`,
    );
  }
}

function validateCampaign() {
  const data = readJson("content/campaign-posts.json");
  assert(typeof data.subtitle === "string", "campaign-posts: subtitle");
  assert(Array.isArray(data.posts), "campaign-posts: posts");
  for (const p of data.posts) {
    assert(typeof p.id === "string" && p.id, `post missing id`);
    isCmsStringList(p.tags ?? [], "tag", `post ${p.id} tags`);
    if (p.slides != null) isCmsStringList(p.slides, "slide", `post ${p.id} slides`);
  }
}

function validatePortfolio() {
  const data = readJson("content/portfolio.json");
  if (data.chaosStudio != null) {
    throw new Error(
      "portfolio.json must not contain chaosStudio — edit content/chaos-studio.json (Chaos Studio tab in CMS)",
    );
  }
  isCmsStringList(data.softSkills ?? [], "skill", "portfolio softSkills");
  for (const job of data.experience?.items ?? []) {
    if (job.bullets?.length) isCmsStringList(job.bullets, "bullet", `job ${job.id} bullets`);
  }
  for (const proj of data.featuredWork?.projects ?? []) {
    if (proj.highlights?.length) isCmsStringList(proj.highlights, "line", `project ${proj.id} highlights`);
    if (proj.tags?.length) isCmsStringList(proj.tags, "tag", `project ${proj.id} tags`);
  }
  for (const cat of data.skills?.categories ?? []) {
    isCmsStringList(cat.tools ?? [], "tool", `skills ${cat.title} tools`);
  }
}

function validateChaosStudio() {
  const cs = readJson("content/chaos-studio.json");
  assert(typeof cs.title === "string", "chaos-studio: title");
  isCmsStringList(cs.highlights ?? [], "line", "chaos-studio highlights");
  isCmsStringList(cs.services ?? [], "service", "chaos-studio services");
  for (const pkg of cs.packages ?? []) {
    isCmsStringList(pkg.features ?? [], "feature", `package ${pkg.id} features`);
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
  isCmsStringList(data.about?.skills ?? [], "skill", "site.config about.skills");
}

function validateAdminAssets() {
  const adminDir = path.join(root, "frontend/public/admin");
  for (const f of [
    "index.html",
    "config.yml",
    "cms-custom.css",
    "cms-custom.js",
    "media-manifest.json",
    "sync-status.json",
    "manifest.webmanifest",
    "sw.js",
  ]) {
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
