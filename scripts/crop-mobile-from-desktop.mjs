/**
 * Center-crop desktop project screenshots to 390×844 phone frames.
 * Usage: node scripts/crop-mobile-from-desktop.mjs <project>
 *   project: cookxpert | forge
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = process.argv[2];
if (!project || !["cookxpert", "forge"].includes(project)) {
  console.error("Usage: node scripts/crop-mobile-from-desktop.mjs <cookxpert|forge>");
  process.exit(1);
}

const desktopDir = path.join(root, "frontend/public/images/projects/frames", project, "desktop");
const mobileDir = path.join(root, "frontend/public/images/projects/frames", project, "mobile");
const heroName = project === "cookxpert" ? "cookxpert_mobile.png" : "forge_mobile.png";
const heroSrc = project === "cookxpert" ? "01-discover-dark.png" : "02-dashboard.png";
const outHero = path.join(root, "frontend/public/images/projects", heroName);
const TARGET_W = 390;
const TARGET_H = 844;

async function cropOne(file) {
  const src = path.join(desktopDir, file);
  const dest = path.join(mobileDir, file);
  const meta = await sharp(src).metadata();
  const w = meta.width ?? TARGET_W;
  const h = meta.height ?? TARGET_H;
  const cropW = Math.min(420, w);
  const cropH = Math.min(Math.round((cropW / TARGET_W) * TARGET_H), h);
  const left = Math.max(0, Math.floor((w - cropW) / 2));
  const top = Math.max(0, Math.floor((h - cropH) / 2));
  await sharp(src)
    .extract({
      left,
      top,
      width: Math.min(cropW, w - left),
      height: Math.min(cropH, h - top),
    })
    .resize(TARGET_W, TARGET_H, { fit: "cover", position: "centre" })
    .png()
    .toFile(dest);
  console.log("→", path.relative(path.join(root, "frontend/public/images/projects"), dest));
}

async function main() {
  if (!fs.existsSync(desktopDir)) {
    console.error("Missing desktop dir:", desktopDir);
    process.exit(1);
  }
  fs.mkdirSync(mobileDir, { recursive: true });
  const files = fs.readdirSync(desktopDir).filter((f) => f.endsWith(".png")).sort();
  for (const file of files) await cropOne(file);
  await sharp(path.join(mobileDir, heroSrc)).png().toFile(outHero);
  console.log("hero", heroName);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
