#!/usr/bin/env node
/** Convert CMS object lists back to string[] for site + simple list widgets. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toStringList } from "./cms-list-shape.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function writeJson(rel, data) {
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${rel}`);
}

function revertPostsFile(rel) {
  const data = JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  for (const post of data.posts) {
    if (post.tags) post.tags = toStringList(post.tags, "tag");
    if (post.slides) post.slides = toStringList(post.slides, "slide");
  }
  writeJson(rel, data);
}

for (const rel of ["content/social-posts.json", "content/gallery-posts.json"]) {
  if (fs.existsSync(path.join(root, rel))) revertPostsFile(rel);
}
if (fs.existsSync(path.join(root, "content/campaign-meta.json"))) {
  /* meta has no list fields */
}

const portfolio = JSON.parse(fs.readFileSync(path.join(root, "content/portfolio.json"), "utf8"));
portfolio.softSkills = toStringList(portfolio.softSkills ?? [], "skill");
for (const job of portfolio.experience?.items ?? []) {
  if (job.bullets) job.bullets = toStringList(job.bullets, "bullet");
}
for (const proj of portfolio.featuredWork?.projects ?? []) {
  if (proj.highlights) proj.highlights = toStringList(proj.highlights, "line");
  if (proj.tags) proj.tags = toStringList(proj.tags, "tag");
}
for (const cat of portfolio.skills?.categories ?? []) {
  if (cat.tools) cat.tools = toStringList(cat.tools, "tool");
}
writeJson("content/portfolio.json", portfolio);

const studio = JSON.parse(fs.readFileSync(path.join(root, "content/chaos-studio.json"), "utf8"));
studio.highlights = toStringList(studio.highlights ?? [], "line");
studio.services = toStringList(studio.services ?? [], "service");
for (const pkg of studio.packages ?? []) {
  if (pkg.features) pkg.features = toStringList(pkg.features, "feature");
}
writeJson("content/chaos-studio.json", studio);

const sitePath = "frontend/public/assets/site.config.json";
const site = JSON.parse(fs.readFileSync(path.join(root, sitePath), "utf8"));
if (site.about?.skills) site.about.skills = toStringList(site.about.skills, "skill");
writeJson(sitePath, site);

console.log("Reverted to string[] list shapes.");
