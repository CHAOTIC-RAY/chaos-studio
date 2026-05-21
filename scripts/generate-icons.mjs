/**
 * Generate PNG favicons / PWA icons from SVG sources (sharp).
 */
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "frontend", "public");
const iconsDir = join(publicDir, "icons");

async function renderPng(svgPath, size, outPath) {
  const svg = await readFile(svgPath);
  await sharp(svg, { density: 288 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  const brand = join(publicDir, "pwa-icon.svg");
  const maskable = join(publicDir, "pwa-icon-maskable.svg");

  const jobs = [
    [brand, 16, "favicon-16.png"],
    [brand, 32, "favicon-32.png"],
    [brand, 180, "apple-touch-icon.png"],
    [brand, 192, "icon-192.png"],
    [brand, 512, "icon-512.png"],
    [maskable, 512, "icon-maskable-512.png"],
  ];

  for (const [src, size, name] of jobs) {
    const dest = join(iconsDir, name);
    await renderPng(src, size, dest);
    console.log(`Wrote icons/${name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
