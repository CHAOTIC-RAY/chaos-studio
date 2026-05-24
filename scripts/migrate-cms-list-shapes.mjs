#!/usr/bin/env node
/** One-time: convert string[] list fields to Decap CMS object shape in content JSON. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toCmsList } from "./cms-list-shape.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function writeJson(rel, data) {
  const p = path.join(root, rel);
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${rel}`);
}

const campaign = JSON.parse(fs.readFileSync(path.join(root, "content/campaign-posts.json"), "utf8"));
for (const post of campaign.posts) {
  if (post.tags) post.tags = toCmsList(post.tags, "tag");
  if (post.slides) post.slides = toCmsList(post.slides, "slide");
}
writeJson("content/campaign-posts.json", campaign);

const portfolio = JSON.parse(fs.readFileSync(path.join(root, "content/portfolio.json"), "utf8"));
portfolio.softSkills = toCmsList(portfolio.softSkills ?? [], "skill");
for (const job of portfolio.experience?.items ?? []) {
  if (job.bullets) job.bullets = toCmsList(job.bullets, "bullet");
}
for (const proj of portfolio.featuredWork?.projects ?? []) {
  if (proj.highlights) proj.highlights = toCmsList(proj.highlights, "line");
  if (proj.tags) proj.tags = toCmsList(proj.tags, "tag");
}
for (const cat of portfolio.skills?.categories ?? []) {
  if (cat.tools) cat.tools = toCmsList(cat.tools, "tool");
}
writeJson("content/portfolio.json", portfolio);

const studio = JSON.parse(fs.readFileSync(path.join(root, "content/chaos-studio.json"), "utf8"));
studio.highlights = toCmsList(studio.highlights ?? [], "line");
studio.services = toCmsList(studio.services ?? [], "service");
for (const pkg of studio.packages ?? []) {
  if (pkg.features) pkg.features = toCmsList(pkg.features, "feature");
}
writeJson("content/chaos-studio.json", studio);

const sitePath = "frontend/public/assets/site.config.json";
const site = JSON.parse(fs.readFileSync(path.join(root, sitePath), "utf8"));
if (site.about?.skills) site.about.skills = toCmsList(site.about.skills, "skill");
writeJson(sitePath, site);

console.log("CMS list shape migration complete.");
