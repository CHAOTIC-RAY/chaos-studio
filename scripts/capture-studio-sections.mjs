/**
 * Studio section screenshots (390 + desktop).
 * BASE_URL=http://127.0.0.1:8799 node scripts/capture-studio-sections.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const artDir = "/opt/cursor/artifacts";
fs.mkdirSync(artDir, { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:8799";

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });

  async function shot(name, viewport, scrollY) {
    const ctx = await browser.newContext({ viewport, colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto(`${base}/studio/`, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(2500);
    if (scrollY) await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(800);
    const out = path.join(artDir, name);
    await page.screenshot({ path: out, type: "png", fullPage: false });
    await ctx.close();
    console.log(out);
  }

  await shot("studio-work-bento-desktop.png", { width: 1280, height: 800 }, 2200);
  await shot("studio-pricing-bento-desktop.png", { width: 1280, height: 800 }, 5200);
  await shot("studio-services-bento-desktop.png", { width: 1280, height: 800 }, 3400);
  await shot("studio-work-bento-mobile.png", { width: 390, height: 844 }, 2100);
  await shot("studio-pricing-bento-mobile.png", { width: 390, height: 844 }, 4800);
  await shot("studio-services-bento-mobile.png", { width: 390, height: 844 }, 3200);
  await shot("studio-about-mobile.png", { width: 390, height: 844 }, 900);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
