import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsPath = path.join(root, "content", "campaign-posts.json");
const metaPath = path.join(root, "content", "campaign-meta.json");
const dest = path.join(root, "frontend", "public", "content", "campaign-posts.json");

if (!fs.existsSync(postsPath)) {
  console.error("Missing content/campaign-posts.json");
  process.exit(1);
}

const posts = JSON.parse(fs.readFileSync(postsPath, "utf8"));
const meta = fs.existsSync(metaPath)
  ? JSON.parse(fs.readFileSync(metaPath, "utf8"))
  : { subtitle: "Campaign & feed highlights" };

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(
  dest,
  `${JSON.stringify({ subtitle: meta.subtitle, posts: posts.posts }, null, 2)}\n`,
);
console.log("Synced campaign meta + posts → frontend/public/content/campaign-posts.json");
