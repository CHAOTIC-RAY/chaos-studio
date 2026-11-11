/**
 * Sample 3 frames per hero clip for faceless QA (manual / artifact review).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clipsDir = path.join(root, "frontend/public/assets/hero-clips");
const art = "/opt/cursor/artifacts/hero-clip-frames";
fs.mkdirSync(art, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(clipsDir, "manifest.json"), "utf8"));

for (const clip of manifest.clips) {
  const mp4 = path.join(clipsDir, `${clip.id}.mp4`);
  if (!fs.existsSync(mp4)) {
    console.warn("missing", clip.id);
    continue;
  }
  for (const t of [0.8, 2.4, 4.2]) {
    const out = path.join(art, `${clip.id}-${t.toFixed(1)}s.jpg`);
    execSync(`ffmpeg -y -ss ${t} -i "${mp4}" -vframes 1 -q:v 3 "${out}"`, { stdio: "pipe" });
  }
  console.log("frames", clip.id, clip.label);
}

console.log("wrote", art);
