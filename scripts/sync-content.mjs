import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "content", "campaign-posts.json");
const dest = path.join(root, "frontend", "public", "content", "campaign-posts.json");

if (!fs.existsSync(src)) {
  console.error("Missing content/campaign-posts.json");
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("Synced campaign-posts.json → frontend/public/content/");
