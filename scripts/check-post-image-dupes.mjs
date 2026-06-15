/**
 * Guard against common post image mistakes:
 * - Two different single-image posts sharing the same file
 * - expressshipping-03 reusing the banner ship panel (slide-02)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsRoot = path.join(root, "frontend", "public", "images", "posts");
function loadAllPosts() {
  const social = JSON.parse(
    fs.readFileSync(path.join(root, "content", "social-posts.json"), "utf8"),
  );
  const galleryPath = path.join(root, "content", "gallery-posts.json");
  const gallery = fs.existsSync(galleryPath)
    ? JSON.parse(fs.readFileSync(galleryPath, "utf8"))
    : { posts: [] };
  return [...(social.posts ?? []), ...(gallery.posts ?? [])];
}

function postIdFromRel(rel) {
  const parts = rel.split(path.sep);
  if (parts.length === 1) return path.basename(parts[0], ".webp");
  return parts[0];
}

function hashFile(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(buf).digest("hex");
}

function walk(dir, base = dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full, base));
    else if (ent.name.endsWith(".webp")) out.push(path.relative(base, full));
  }
  return out;
}

const allPosts = loadAllPosts();
const singleImagePosts = new Set(
  allPosts
    .filter((p) => !p.slides || p.slides.length <= 1)
    .map((p) => p.id),
);

const byHash = new Map();
for (const rel of walk(postsRoot)) {
  const full = path.join(postsRoot, rel);
  const h = hashFile(full);
  const postId = postIdFromRel(rel);
  if (!byHash.has(h)) byHash.set(h, []);
  byHash.get(h).push({ postId, rel });
}

const errors = [];

for (const [hash, entries] of byHash) {
  const postIds = [...new Set(entries.map((e) => e.postId))];
  const singles = postIds.filter((id) => singleImagePosts.has(id));
  if (singles.length >= 2) {
    errors.push(
      `Single-image posts share the same file (${hash}): ${singles.join(", ")}`,
    );
  }
}

const shipPanel = path.join(postsRoot, "expressshipping-01", "slide-02.webp");
const brandPost = path.join(postsRoot, "expressshipping-03.webp");
if (fs.existsSync(shipPanel) && fs.existsSync(brandPost)) {
  if (hashFile(shipPanel) === hashFile(brandPost)) {
    errors.push(
      "expressshipping-03.webp must not reuse expressshipping-01/slide-02.webp (banner ship panel).",
    );
  }
}

if (errors.length) {
  console.error("Post image check failed:\n");
  errors.forEach((e) => console.error(`  • ${e}`));
  process.exit(1);
}

console.log("OK — post image checks passed.");
