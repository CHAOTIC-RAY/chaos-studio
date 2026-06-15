/**
 * Gallery panorama assets — lighter thumbs + preview videos for tile rendering.
 * Full-resolution files stay for lightbox; tiles use *.pano.webp and preview.mp4.
 *
 * Usage: node scripts/generate-pano-thumbs.mjs [--force]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "frontend", "public");
const force = process.argv.includes("--force");

/** ~2× largest pano tile width (300px desktop) — sharp on screen, small on disk */
const PANO_MAX_EDGE = 560;
const PANO_WEBP = { quality: 82, effort: 4, smartSubsample: true };

const POSTS = path.join(publicRoot, "images", "posts");
const PROJECTS = path.join(publicRoot, "images", "projects");

let thumbs = 0;
let videos = 0;
let skipped = 0;

function isFresh(src, dest) {
  if (force || !fs.existsSync(dest)) return false;
  return fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;
}

async function writePanoThumb(src) {
  if (!src.endsWith(".webp") || src.includes(".pano.webp")) return;
  const dest = src.replace(/\.webp$/i, ".pano.webp");
  if (isFresh(src, dest)) {
    skipped++;
    return;
  }
  const meta = await sharp(src).metadata();
  const edge = Math.max(meta.width ?? 0, meta.height ?? 0);
  let pipeline = sharp(src).rotate();
  if (edge > PANO_MAX_EDGE) {
    pipeline = pipeline.resize(PANO_MAX_EDGE, PANO_MAX_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const buf = await pipeline.webp(PANO_WEBP).toBuffer();
  await fs.promises.writeFile(dest, buf);
  thumbs++;
  console.log(`thumb  ${path.relative(publicRoot, dest)} (${Math.round(buf.length / 1024)} KiB)`);
}

function writePreviewVideo(src) {
  if (path.basename(src) !== "video.mp4") return;
  const dest = path.join(path.dirname(src), "preview.mp4");
  if (isFresh(src, dest)) {
    skipped++;
    return;
  }
  const tmp = `${dest}.tmp.mp4`;
  try {
    execSync(
      `ffmpeg -y -i "${src}" -vf "scale='min(480,iw)':-2" -c:v libx264 -crf 28 -preset faster -profile:v main -pix_fmt yuv420p -movflags +faststart -an "${tmp}"`,
      { stdio: "pipe" },
    );
    fs.renameSync(tmp, dest);
    videos++;
    const kb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`preview  ${path.relative(publicRoot, dest)} (${kb} KiB)`);
  } catch {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    console.warn(`skip video: ${path.relative(publicRoot, src)}`);
  }
}

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(abs);
    else yield abs;
  }
}

async function main() {
  const images = [
    ...walk(POSTS),
    ...walk(PROJECTS),
    ...walk(path.join(publicRoot, "images", "projects", "frames")),
  ].filter((f) => f.endsWith(".webp") && !f.includes(".pano.webp"));

  const postVideos = [...walk(POSTS)].filter((f) => f.endsWith("video.mp4"));

  console.log(`Generating pano thumbs for ${images.length} images, ${postVideos.length} videos…`);

  for (const file of images) {
    try {
      await writePanoThumb(file);
    } catch (e) {
      console.warn(`skip thumb ${path.relative(publicRoot, file)}: ${e.message}`);
    }
  }

  for (const file of postVideos) {
    writePreviewVideo(file);
  }

  console.log(`Done. ${thumbs} thumbs, ${videos} previews, ${skipped} up to date.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
