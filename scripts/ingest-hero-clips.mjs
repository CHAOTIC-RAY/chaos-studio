/**
 * Artistic hero clips — Mixkit 720p, ~6s, mp4+webm+poster.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "frontend/public/assets/hero-clips");

const CLIPS = [
  { id: "waves", mixkitId: 1228, label: "Ocean waves on shore", category: "scenery", source: "https://mixkit.co/free-stock-video/waves-coming-to-the-shore-1228/" },
  { id: "mountains", mixkitId: 2125, label: "Sunset over mountains", category: "scenery", source: "https://mixkit.co/free-stock-video/beautiful-sunset-over-mountains-2125/" },
  { id: "forest", mixkitId: 10234, label: "Aerial forest morning", category: "scenery", source: "https://mixkit.co/free-stock-video/aerial-view-of-the-forest-in-the-morning-10234/" },
  { id: "beach", mixkitId: 3985, label: "Aerial beach and sea", category: "scenery", source: "https://mixkit.co/free-stock-video/aerial-view-of-a-beach-and-the-sea-3985/" },
  { id: "palms", mixkitId: 1244, label: "Palm trees by the beach", category: "scenery", source: "https://mixkit.co/free-stock-video/palm-trees-by-the-beach-1244/" },
  { id: "birds", mixkitId: 1176, label: "Birds flying over the ocean", category: "animals", source: "https://mixkit.co/free-stock-video/birds-flying-over-the-ocean-1176/" },
  { id: "reef", mixkitId: 5061, label: "Coral reef and tropical fish", category: "animals", source: "https://mixkit.co/free-stock-video/underwater-coral-reef-and-tropical-fish-5061/" },
  { id: "rain", mixkitId: 5071, label: "Rain on tropical leaves", category: "scenery", source: "https://mixkit.co/free-stock-video/rain-falling-on-green-leaves-5071/" },
  { id: "snowpeak", mixkitId: 3362, label: "Skier at snowy mountain peak", category: "scenery", source: "https://mixkit.co/free-stock-video/skier-at-the-peak-of-a-snowy-mountain-3362/" },
  { id: "flowers", mixkitId: 5209, label: "Calla lily arrangement", category: "abstract", source: "https://mixkit.co/free-stock-video/flower-arrangement-with-flowers-and-calla-lilies-5209/" },
];

const vf = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=30";
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

fs.mkdirSync(outDir, { recursive: true });

const activeIds = new Set(CLIPS.map((c) => c.id));
for (const file of fs.readdirSync(outDir)) {
  const base = file.replace(/\.(mp4|webm|jpg|raw\.mp4)$/, "").replace(/-poster$/, "");
  if (!activeIds.has(base) && /\.(mp4|webm|jpg)$/.test(file)) {
    try {
      fs.unlinkSync(path.join(outDir, file));
    } catch {
      /* */
    }
  }
}

for (const clip of CLIPS) {
  const src = `https://assets.mixkit.co/videos/${clip.mixkitId}/${clip.mixkitId}-720.mp4`;
  const raw = path.join(outDir, `${clip.id}.raw.mp4`);
  const mp4 = path.join(outDir, `${clip.id}.mp4`);
  const webm = path.join(outDir, `${clip.id}.webm`);
  const poster = path.join(outDir, `${clip.id}-poster.jpg`);
  console.log("→", clip.id);
  run(`curl -fsSL "${src}" -o "${raw}"`);
  run(
    `ffmpeg -y -i "${raw}" -t 6 -an -vf "${vf}" -c:v libx264 -pix_fmt yuv420p -crf 29 -preset fast -movflags +faststart "${mp4}"`,
  );
  run(`ffmpeg -y -i "${mp4}" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -cpu-used 4 -an "${webm}"`);
  run(`ffmpeg -y -i "${mp4}" -ss 1.2 -vframes 1 -q:v 4 "${poster}"`);
  fs.unlinkSync(raw);
}

const manifest = {
  provider: "Mixkit",
  licenseName: "Mixkit License",
  licenseUrl: "https://mixkit.co/license/",
  licenseNote: "Free for commercial use; no attribution required.",
  clips: CLIPS.map((c) => ({
    id: c.id,
    label: c.label,
    category: c.category,
    mp4: `/assets/hero-clips/${c.id}.mp4`,
    webm: `/assets/hero-clips/${c.id}.webm`,
    poster: `/assets/hero-clips/${c.id}-poster.jpg`,
    source: c.source,
    duration: 6,
  })),
};
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("Done", CLIPS.length);
