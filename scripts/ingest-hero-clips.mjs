/**
 * Faceless hero clips — animals + macro scenery only (Mixkit 720p, ~6s).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "frontend/public/assets/hero-clips");

/** mixkitId = trailing numeric id from mixkit.co/free-stock-video/...-{id}/ */
const CLIPS = [
  { id: "watertexture", mixkitId: 50165, label: "Blue sea water texture (macro)", category: "scenery", source: "https://mixkit.co/free-stock-video/blue-sea-water-texture-waving-gently-50165/" },
  { id: "flames", mixkitId: 52306, label: "Blazing orange flames (macro)", category: "scenery", source: "https://mixkit.co/free-stock-video/close-up-of-blazing-orange-flames-over-a-pitch-dark-52306/" },
  { id: "jellyfish", mixkitId: 25353, label: "Spotted jellyfish (close-up)", category: "animals", source: "https://mixkit.co/free-stock-video/jellyfish-with-spots-25353/" },
  { id: "reef", mixkitId: 44869, label: "Coral reef Moorish Idol fish", category: "animals", source: "https://mixkit.co/free-stock-video/coral-reef-in-the-red-sea-with-moorish-idol-fish-swimming-44869/" },
  { id: "butterfly", mixkitId: 4088, label: "Butterfly on flower (macro)", category: "animals", source: "https://mixkit.co/free-stock-video/black-and-red-butterfly-fluttering-on-a-flower-4088/" },
  { id: "bee", mixkitId: 32477, label: "Bumblebee macro", category: "animals", source: "https://mixkit.co/free-stock-video/bumblebee-macro-close-up-32477/" },
  { id: "lion", mixkitId: 6736, label: "Lion head portrait in sun", category: "animals", source: "https://mixkit.co/free-stock-video/lion-head-portrait-in-the-sun-6736/" },
  { id: "hummingbird", mixkitId: 8549, label: "Green hummingbird on stem", category: "animals", source: "https://mixkit.co/free-stock-video/closeup-of-green-hummingbird-sitting-on-stem-8549/" },
  { id: "rainlake", mixkitId: 18312, label: "Rain ripples on lake", category: "scenery", source: "https://mixkit.co/free-stock-video/rain-falling-on-the-water-of-a-lake-seen-up-18312/" },
  { id: "rainleaf", mixkitId: 5071, label: "Rain on tropical leaves", category: "scenery", source: "https://mixkit.co/free-stock-video/rain-falling-on-green-leaves-5071/" },
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
  console.log("→", clip.id, clip.mixkitId);
  run(`curl -fsSL "${src}" -o "${raw}"`);
  run(
    `ffmpeg -y -i "${raw}" -t 6 -an -vf "${vf}" -c:v libx264 -pix_fmt yuv420p -crf 29 -preset fast -movflags +faststart "${mp4}"`,
  );
  run(`ffmpeg -y -i "${mp4}" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -cpu-used 4 -an "${webm}"`);
  run(`ffmpeg -y -i "${mp4}" -ss 1.2 -vframes 1 -q:v 4 "${poster}"`);
  fs.unlinkSync(raw);
}

const assetVersion = new Date().toISOString().slice(0, 10).replace(/-/g, "");

const manifest = {
  version: assetVersion,
  provider: "Mixkit",
  licenseName: "Mixkit License",
  licenseUrl: "https://mixkit.co/license/",
  licenseNote: "Free for commercial use; no attribution required.",
  policy: "Faceless only: animals and macro scenery; no people.",
  clips: CLIPS.map((c) => ({
    id: c.id,
    label: c.label,
    category: c.category,
    version: assetVersion,
    mp4: `/assets/hero-clips/${c.id}.mp4?v=${assetVersion}`,
    webm: `/assets/hero-clips/${c.id}.webm?v=${assetVersion}`,
    poster: `/assets/hero-clips/${c.id}-poster.jpg?v=${assetVersion}`,
    source: c.source,
    duration: 6,
  })),
};
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("Done", CLIPS.length);
