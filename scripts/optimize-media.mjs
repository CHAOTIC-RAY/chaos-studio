/**
 * Loss-aware media optimizer for frontend/public.
 * - WebP: re-encode at high quality; replace only when smaller.
 * - PNG/JPEG: convert to WebP; remove source when WebP is smaller.
 * - MP4/WebM: ffmpeg high-quality re-encode; replace only when smaller.
 *
 * Usage: node scripts/optimize-media.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "frontend", "public");
const dryRun = process.argv.includes("--dry-run");

/** Generated favicons/PWA icons — already small PNGs from SVG. */
const SKIP_PREFIXES = [path.join(publicRoot, "icons") + path.sep];

const WEBP_OPTS = { quality: 92, effort: 6, smartSubsample: true };
/** Posts are shown in cards/rails — cap edge length to save bytes without visible loss on screen. */
const POST_WEBP_OPTS = { quality: 88, effort: 6, smartSubsample: true };
const POST_MAX_EDGE = 2048;
const CONVERT_OPTS = { quality: 90, effort: 6, smartSubsample: true };

const postsDir = path.join(publicRoot, "images", "posts") + path.sep;

const IMAGE_RE = /\.(webp|png|jpe?g)$/i;
const VIDEO_RE = /\.(mp4|webm|mov)$/i;

let imgSaved = 0;
let imgSkipped = 0;
let vidSaved = 0;
let vidSkipped = 0;

function shouldSkip(abs) {
  return SKIP_PREFIXES.some((p) => abs.startsWith(p));
}

function* walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(abs);
    else yield abs;
  }
}

async function optimizeWebp(file) {
  const before = fs.statSync(file).size;
  const isPost = file.startsWith(postsDir);
  let pipeline = sharp(file).rotate();
  if (isPost) {
    const meta = await sharp(file).metadata();
    const edge = Math.max(meta.width ?? 0, meta.height ?? 0);
    if (edge > POST_MAX_EDGE) {
      pipeline = sharp(file)
        .rotate()
        .resize(POST_MAX_EDGE, POST_MAX_EDGE, { fit: "inside", withoutEnlargement: true });
    }
  }
  const buf = await pipeline.webp(isPost ? POST_WEBP_OPTS : WEBP_OPTS).toBuffer();
  if (buf.length >= before) {
    imgSkipped++;
    return;
  }
  if (!dryRun) await fs.promises.writeFile(file, buf);
  imgSaved += before - buf.length;
  console.log(`webp  -${((1 - buf.length / before) * 100).toFixed(1)}%  ${path.relative(publicRoot, file)}`);
}

async function convertRasterToWebp(file) {
  const dest = file.replace(/\.(png|jpe?g)$/i, ".webp");
  if (dest === file) return;
  const before = fs.statSync(file).size;
  const buf = await sharp(file).rotate().webp(CONVERT_OPTS).toBuffer();
  if (buf.length >= before) {
    imgSkipped++;
    return;
  }
  if (!dryRun) {
    await fs.promises.writeFile(dest, buf);
    fs.unlinkSync(file);
  }
  imgSaved += before - buf.length;
  console.log(
    `conv  -${((1 - buf.length / before) * 100).toFixed(1)}%  ${path.relative(publicRoot, file)} → ${path.basename(dest)}`,
  );
}

function optimizeVideo(file) {
  const ext = path.extname(file).toLowerCase();
  const tmp = `${file}.opt${ext}`;
  const before = fs.statSync(file).size;

  try {
    if (ext === ".webm") {
      execSync(
        `ffmpeg -y -i "${file}" -c:v libvpx-vp9 -crf 28 -b:v 0 -row-mt 1 -cpu-used 2 -pix_fmt yuv420p -an "${tmp}"`,
        { stdio: "pipe" },
      );
    } else {
      execSync(
        `ffmpeg -y -i "${file}" -c:v libx264 -crf 22 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 80k -ac 2 "${tmp}"`,
        { stdio: "pipe" },
      );
    }
  } catch (e) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    console.warn(`skip video (encode failed): ${path.relative(publicRoot, file)}`);
    vidSkipped++;
    return;
  }

  if (!fs.existsSync(tmp)) {
    vidSkipped++;
    return;
  }

  const after = fs.statSync(tmp).size;
  if (after >= before) {
    if (!dryRun) fs.unlinkSync(tmp);
    vidSkipped++;
    return;
  }

  if (!dryRun) {
    fs.renameSync(tmp, file);
  } else {
    fs.unlinkSync(tmp);
  }
  vidSaved += before - after;
  console.log(`video -${((1 - after / before) * 100).toFixed(1)}%  ${path.relative(publicRoot, file)}`);
}

async function main() {
  const files = [...walk(publicRoot)].filter((f) => !shouldSkip(f));
  const images = files.filter((f) => IMAGE_RE.test(f));
  const videos = files.filter((f) => VIDEO_RE.test(f));

  console.log(
    dryRun ? "[dry-run] " : "",
    `Optimizing ${images.length} images, ${videos.length} videos under frontend/public …`,
  );

  for (const file of images) {
    const lower = file.toLowerCase();
    try {
      if (lower.endsWith(".webp")) await optimizeWebp(file);
      else await convertRasterToWebp(file);
    } catch (e) {
      console.warn(`skip image: ${path.relative(publicRoot, file)} — ${e.message}`);
      imgSkipped++;
    }
  }

  for (const file of videos) {
    try {
      optimizeVideo(file);
    } catch (e) {
      console.warn(`skip video: ${path.relative(publicRoot, file)} — ${e.message}`);
      vidSkipped++;
    }
  }

  const fmt = (n) => `${(n / 1024 / 1024).toFixed(2)} MiB`;
  console.log(
    `\nDone. Images saved ${fmt(imgSaved)} (${imgSkipped} unchanged). Videos saved ${fmt(vidSaved)} (${vidSkipped} unchanged).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
