#!/usr/bin/env node
/**
 * One-time split: content/campaign-posts.json → social-posts.json + gallery-posts.json
 * Gallery: reels, posters, media kits, and multi-slide visual pieces (4+ slides).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacy = path.join(root, "content", "campaign-posts.json");
const socialOut = path.join(root, "content", "social-posts.json");
const galleryOut = path.join(root, "content", "gallery-posts.json");

function isGalleryPost(p) {
  if (!p?.id || p.id.startsWith("_")) return false;
  if (p.cardLayout === "poster" || p.cardLayout === "media-kit") return true;
  if (p.platform === "Media kit" || p.platform === "Print / OOH") return true;
  if (p.video) return true;
  if ((p.slides?.length ?? 0) >= 4) return true;
  return false;
}

if (!fs.existsSync(legacy)) {
  if (fs.existsSync(socialOut) && fs.existsSync(galleryOut)) {
    console.log("social-posts.json and gallery-posts.json already exist — skip split.");
    process.exit(0);
  }
  console.error("Missing content/campaign-posts.json and no split files found.");
  process.exit(1);
}

const { posts } = JSON.parse(fs.readFileSync(legacy, "utf8"));
const social = [];
const gallery = [];

for (const post of posts) {
  if (post.id?.startsWith("_")) {
    social.push(post);
    continue;
  }
  (isGalleryPost(post) ? gallery : social).push(post);
}

fs.writeFileSync(socialOut, `${JSON.stringify({ posts: social }, null, 2)}\n`);
fs.writeFileSync(galleryOut, `${JSON.stringify({ posts: gallery }, null, 2)}\n`);
console.log(`Split ${posts.length} posts → social: ${social.length}, gallery: ${gallery.length}`);
