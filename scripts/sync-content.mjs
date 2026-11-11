import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const socialPath = path.join(root, "content", "social-posts.json");
const galleryPath = path.join(root, "content", "gallery-posts.json");
const metaPath = path.join(root, "content", "campaign-meta.json");
const publicDir = path.join(root, "frontend", "public", "content");
const siteDefaultsSrc = path.join(root, "content", "site-content.defaults.json");

if (!fs.existsSync(socialPath)) {
  console.error("Missing content/social-posts.json");
  process.exit(1);
}

const social = JSON.parse(fs.readFileSync(socialPath, "utf8"));
const meta = fs.existsSync(metaPath)
  ? JSON.parse(fs.readFileSync(metaPath, "utf8"))
  : { subtitle: "Campaign & feed highlights" };

fs.mkdirSync(publicDir, { recursive: true });

if (fs.existsSync(siteDefaultsSrc)) {
  fs.copyFileSync(
    siteDefaultsSrc,
    path.join(publicDir, "site-content.defaults.json"),
  );
  console.log("Synced site defaults → frontend/public/content/site-content.defaults.json");
}

fs.writeFileSync(
  path.join(publicDir, "social-posts.json"),
  `${JSON.stringify(social, null, 2)}\n`,
);
console.log("Synced social posts → frontend/public/content/social-posts.json");

if (fs.existsSync(galleryPath)) {
  const gallery = JSON.parse(fs.readFileSync(galleryPath, "utf8"));
  fs.writeFileSync(
    path.join(publicDir, "gallery-posts.json"),
    `${JSON.stringify(gallery, null, 2)}\n`,
  );
  console.log("Synced gallery posts → frontend/public/content/gallery-posts.json");
}

// Legacy mirror for older tooling (subtitle + feed posts only)
fs.writeFileSync(
  path.join(publicDir, "campaign-posts.json"),
  `${JSON.stringify({ subtitle: meta.subtitle, posts: social.posts }, null, 2)}\n`,
);
console.log("Synced campaign meta + feed → frontend/public/content/campaign-posts.json");

const galleryPagePath = path.join(root, "content", "gallery.json");
const galleryPageDest = path.join(publicDir, "gallery.json");
if (fs.existsSync(galleryPagePath)) {
  const galleryPage = JSON.parse(fs.readFileSync(galleryPagePath, "utf8"));
  fs.writeFileSync(galleryPageDest, `${JSON.stringify(galleryPage, null, 2)}\n`);
  console.log("Synced gallery page copy → frontend/public/content/gallery.json");
}
