/**
 * Re-capture project screenshots & preview videos for the portfolio.
 * Requires: npm install playwright (in /tmp or globally) + npx playwright install chromium
 *
 * Usage: node scripts/capture-project-media.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "frontend/public/images/projects");
const videos = path.join(out, "videos");

async function main() {
  const { chromium } = await import("playwright");
  fs.mkdirSync(videos, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  async function screenshot(url, file, viewport) {
    const ctx = await browser.newContext({ viewport, colorScheme: "dark", isMobile: viewport.width < 500 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(out, file), type: "png" });
    await ctx.close();
    console.log("png", file);
  }

  await screenshot("https://cookxpert.chaoticstudio.workers.dev/", "cookxpert_desktop.png", {
    width: 1280,
    height: 800,
  });
  await screenshot("https://cookxpert.chaoticstudio.workers.dev/", "cookxpert_mobile.png", {
    width: 390,
    height: 844,
  });
  await screenshot("https://forge.chaoticstudio.workers.dev/dashboard", "forge_desktop.png", {
    width: 1280,
    height: 800,
  });
  await screenshot("https://forge.chaoticstudio.workers.dev/dashboard", "forge_mobile.png", {
    width: 390,
    height: 844,
  });

  await browser.close();

  execSync(
    `ffmpeg -y -loop 1 -i "${path.join(out, "faisa_mobile.png")}" -vf "scale=780:1688,zoompan=z='min(zoom+0.0012,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=390x844:fps=30" -t 5 -c:v libvpx-vp9 -pix_fmt yuv420p "${path.join(videos, "faisa_mobile.webm")}"`,
    { stdio: "inherit" },
  );

  console.log("Done. Run CookXpert video capture separately if needed (see repo history).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
