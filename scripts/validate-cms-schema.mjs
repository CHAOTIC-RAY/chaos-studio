#!/usr/bin/env node
/**
 * Guardrails: JSON list fields are string[] (Decap simple list widgets).
 * Worker also accepts legacy {tag:"..."} objects via cms-list-shape normalizer.
 */
import fs from "node:fs";
import path from "node:path";
import { toStringList } from "./cms-list-shape.mjs";

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
  const normalized = toStringList(v, "x");
  assert(
    v.every((item, i) => typeof item === "string" && item === normalized[i]),
    `${label} must be string[] — run: npm run revert:cms-lists`,
  );
}

function validateCampaign() {
  const meta = readJson("content/campaign-meta.json");
  assert(typeof meta.subtitle === "string", "campaign-meta: subtitle");
  const data = readJson("content/campaign-posts.json");
  assert(Array.isArray(data.posts), "campaign-posts: posts");
  for (const p of data.posts) {
    assert(typeof p.id === "string" && p.id, `post missing id`);
    isStringArray(p.tags ?? [], `post ${p.id} tags`);
    if (p.slides != null) isStringArray(p.slides, `post ${p.id} slides`);
  }
}

function validatePortfolio() {
  const data = readJson("content/portfolio.json");
  if (data.chaosStudio != null) {
    throw new Error(
      "portfolio.json must not contain chaosStudio — edit content/chaos-studio.json",
    );
  }
  isStringArray(data.softSkills ?? [], "portfolio softSkills");
  for (const job of data.experience?.items ?? []) {
    if (job.bullets?.length) isStringArray(job.bullets, `job ${job.id} bullets`);
  }
  for (const proj of data.featuredWork?.projects ?? []) {
    if (proj.highlights?.length) isStringArray(proj.highlights, `project ${proj.id} highlights`);
    if (proj.tags?.length) isStringArray(proj.tags, `project ${proj.id} tags`);
  }
  for (const cat of data.skills?.categories ?? []) {
    isStringArray(cat.tools ?? [], `skills ${cat.title} tools`);
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
    assert(data[key] != null, `site.config.json missing "${key}"`);
  }
  isStringArray(data.about?.skills ?? [], "site.config about.skills");
}

function validateAdminAssets() {
  const adminDir = path.join(root, "frontend/public/admin");
  for (const f of [
    "index.html",
    "config.yml",
    "cms-app.css",
    "cms-app.js",
    "media-manifest.json",
    "sync-status.json",
    "manifest.webmanifest",
    "sw.js",
  ]) {
    assert(fs.existsSync(path.join(adminDir, f)), `Missing frontend/public/admin/${f}`);
  }
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
