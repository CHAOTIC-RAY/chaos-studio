/**
 * Capture Forge mobile viewport screenshots for portfolio phone frame.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://forge.chaoticstudio.workers.dev";
const outDir = path.join(root, "frontend/public/images/projects");
const framesDir = path.join(outDir, "frames/forge/mobile");
const WAIT = 10000;
const MOBILE = { width: 390, height: 844 };

async function ready(page, route = "/dashboard") {
  await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(WAIT);
}

async function shot(page, file) {
  await page.screenshot({ path: path.join(framesDir, file), type: "png", fullPage: false });
  console.log("saved", file);
}

async function main() {
  const { chromium } = await import("playwright");
  fs.mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const routes = [
    ["/", "01-profile.png"],
    ["/dashboard", "02-dashboard.png"],
    ["/calendar", "03-calendar.png"],
    ["/scheduling", "04-scheduling.png"],
    ["/ideas", "05-ideas.png"],
    ["/idea-board", "06-idea-board.png"],
    ["/hook-generator", "07-hook-generator.png"],
    ["/trends", "08-trends.png"],
  ];

  for (const [route, file] of routes) {
    const ctx = await browser.newContext({
      viewport: MOBILE,
      colorScheme: "dark",
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await ready(page, route);
    if (file === "02-dashboard.png") {
      await page.screenshot({ path: path.join(outDir, "forge_mobile.png"), type: "png" });
    }
    await shot(page, file);
    await ctx.close();
  }

  await browser.close();
  console.log("Forge mobile captures complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
