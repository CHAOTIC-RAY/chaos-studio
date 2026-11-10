/**
 * Record ~15s of the generative hero canvas loop.
 * Usage: BASE_URL=http://127.0.0.1:8799 node scripts/capture-hero-reel.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.BASE_URL || "http://127.0.0.1:8799";
const artDir = "/opt/cursor/artifacts";
fs.mkdirSync(artDir, { recursive: true });

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: "dark",
    recordVideo: {
      dir: artDir,
      size: { width: 1280, height: 720 },
    },
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/studio/`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector("#hero-gen-canvas", { timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.waitForTimeout(15000);
  const png = path.join(artDir, "hero-gen-desktop.png");
  await page.screenshot({ path: png, type: "png" });
  const video = await page.video();
  await page.close();
  await ctx.close();
  await browser.close();
  const raw = await video.path();
  const outMp4 = path.join(artDir, "hero-gen-loop.mp4");
  execSync(
    `ffmpeg -y -i "${raw}" -vf "fps=30,scale=1280:720" -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart -an -t 15 "${outMp4}"`,
    { stdio: "inherit" },
  );
  console.log("Wrote", outMp4, png);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
