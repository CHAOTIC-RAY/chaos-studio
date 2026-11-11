/**
 * Sample 6 frames per hero clip (mp4 + webm) for faceless QA.
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
const times = [0.5, 1.2, 2.0, 3.0, 4.0, 5.2];
const rows = [];

for (const clip of manifest.clips) {
  for (const ext of ["mp4", "webm"]) {
    const file = path.join(clipsDir, `${clip.id}.${ext}`);
    if (!fs.existsSync(file)) {
      rows.push({ clip: clip.id, ext, status: "missing" });
      continue;
    }
    for (const t of times) {
      const out = path.join(art, `${clip.id}-${ext}-${t}s.jpg`);
      execSync(`ffmpeg -y -ss ${t} -i "${file}" -vframes 1 -q:v 3 "${out}"`, { stdio: "pipe" });
    }
    rows.push({ clip: clip.id, ext, status: "ok", frames: times.length });
  }
}

fs.writeFileSync(path.join(art, "frame-report.json"), `${JSON.stringify(rows, null, 2)}\n`);
console.log("frames →", art);
console.log(rows);
