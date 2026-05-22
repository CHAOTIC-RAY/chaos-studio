/**
 * Build Forge phone frames by center-cropping desktop zip screenshots (390×844).
 * Use when live mobile routes are unavailable.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const desktopDir = path.join(root, "frontend/public/images/projects/frames/forge/desktop");
const mobileDir = path.join(root, "frontend/public/images/projects/frames/forge/mobile");
const outHero = path.join(root, "frontend/public/images/projects/forge_mobile.png");

const TARGET_W = 390;
const TARGET_H = 844;

async function cropOne(file) {
  const src = path.join(desktopDir, file);
  const dest = path.join(mobileDir, file);
  const meta = await sharp(src).metadata();
  const w = meta.width ?? TARGET_W;
  const h = meta.height ?? TARGET_H;
  const cropW = Math.min(TARGET_W, w);
  const cropH = Math.round((cropW / TARGET_W) * TARGET_H);
  const left = Math.max(0, Math.floor((w - cropW) / 2));
  const top = Math.max(0, Math.floor((h - Math.min(cropH, h)) / 2));
  await sharp(src)
    .extract({ left, top, width: Math.min(cropW, w - left), height: Math.min(cropH, h - top) })
    .resize(TARGET_W, TARGET_H, { fit: "cover", position: "centre" })
    .png()
    .toFile(dest);
  console.log("cropped", file);
}

async function main() {
  fs.mkdirSync(mobileDir, { recursive: true });
  const files = fs.readdirSync(desktopDir).filter((f) => f.endsWith(".png"));
  for (const file of files) await cropOne(file);
  await sharp(path.join(mobileDir, "02-dashboard.png")).png().toFile(outHero);
  console.log("hero forge_mobile.png updated");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
