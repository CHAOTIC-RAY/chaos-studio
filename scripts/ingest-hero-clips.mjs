/**
 * Download Mixkit 720p sources, trim ~6s, encode mp4+webm+poster (<2MB target).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "frontend/public/assets/hero-clips");

const CLIPS = [
  {
    id: "traffic",
    mixkitId: 16552,
    label: "City traffic during the day",
    source: "https://mixkit.co/free-stock-video/city-traffic-during-the-day-16552/",
    category: "city",
  },
  {
    id: "crowd",
    mixkitId: 4437,
    label: "Crowd walking in a Japanese street",
    source: "https://mixkit.co/free-stock-video/people-walking-in-the-street-in-japan-4437/",
    category: "people",
  },
  {
    id: "hands",
    mixkitId: 23327,
    label: "Hands sorting through clothes",
    source: "https://mixkit.co/free-stock-video/hand-selecting-through-clothes-23327/",
    category: "hands",
  },
  {
    id: "fashion",
    mixkitId: 44556,
    label: "Fashion — stylish woman by a Camaro",
    source: "https://mixkit.co/free-stock-video/stylish-woman-leaning-in-a-camaro-44556/",
    category: "fashion",
  },
  {
    id: "sport",
    mixkitId: 2289,
    label: "Basketball slam dunk",
    source: "https://mixkit.co/free-stock-video/man-doing-a-slam-dunk-2289/",
    category: "sport",
  },
  {
    id: "waves",
    mixkitId: 1228,
    label: "Ocean waves on shore",
    source: "https://mixkit.co/free-stock-video/waves-coming-to-the-shore-1228/",
    category: "ocean",
  },
  {
    id: "neon",
    mixkitId: 4128,
    label: "Electronic ticker / city lights",
    source: "https://mixkit.co/free-stock-video/electronic-ticker-in-the-street-4128/",
    category: "abstract",
  },
  {
    id: "aerial",
    mixkitId: 1615,
    label: "Aerial roundabout traffic",
    source: "https://mixkit.co/free-stock-video/city-traffic-going-around-a-roundabout-from-above-1615/",
    category: "city",
  },
  {
    id: "reef",
    mixkitId: 5061,
    label: "Underwater coral reef",
    source: "https://mixkit.co/free-stock-video/underwater-coral-reef-and-tropical-fish-5061/",
    category: "ocean",
  },
  {
    id: "tourist",
    mixkitId: 19544,
    label: "Busy tourist district timelapse",
    source: "https://mixkit.co/free-stock-video/very-busy-tourist-area-time-lapse-static-shot-19544/",
    category: "crowd",
  },
];

const vf = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=30";

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

fs.mkdirSync(outDir, { recursive: true });

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
  run(
    `ffmpeg -y -i "${mp4}" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -cpu-used 4 -an "${webm}"`,
  );
  run(`ffmpeg -y -i "${mp4}" -ss 1.2 -vframes 1 -q:v 4 "${poster}"`);
  fs.unlinkSync(raw);
  const mb = (fs.statSync(mp4).size / 1024 / 1024).toFixed(2);
  console.log(`  mp4 ${mb} MB`);
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
console.log("Wrote manifest with", CLIPS.length, "clips");
