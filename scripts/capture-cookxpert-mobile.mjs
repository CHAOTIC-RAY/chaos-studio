/**
 * Capture CookXpert mobile viewport screenshots (desktop frames come from Faisa.zip).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://cookxpert.chaoticstudio.workers.dev";
const outDir = path.join(root, "frontend/public/images/projects");
const framesDir = path.join(outDir, "frames/cookxpert/mobile");
const WAIT = 12000;
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true };

async function ready(page) {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(WAIT);
}

async function openAiChat(page) {
  const buttons = await page.locator("button").all();
  for (const b of buttons) {
    const box = await b.boundingBox();
    if (box && box.y > 400 && box.width > 40) {
      await b.click();
      await page.waitForTimeout(2000);
      return;
    }
  }
}

async function goFridge(page) {
  await page.getByRole("button", { name: "Go to Fridge" }).click();
  await page.waitForTimeout(2500);
}

async function goHome(page) {
  await page.getByRole("button", { name: "Go to Home" }).click();
  await page.waitForTimeout(2500);
}

async function goLibrary(page) {
  await page.getByRole("button", { name: "Go to Library" }).click();
  await page.waitForTimeout(2500);
}

async function goSettings(page) {
  await page.getByRole("button", { name: "Go to Settings" }).click();
  await page.waitForTimeout(2500);
}

async function shot(page, file) {
  await page.screenshot({ path: path.join(framesDir, file), type: "png" });
  console.log("saved", file);
}

async function main() {
  fs.mkdirSync(framesDir, { recursive: true });
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  // 01 discover + AI (hero)
  {
    const ctx = await browser.newContext({ viewport: MOBILE, colorScheme: "dark", isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await ready(page);
    await openAiChat(page);
    await page.screenshot({ path: path.join(outDir, "cookxpert_mobile.png"), type: "png" });
    await shot(page, "01-discover-dark.png");
    await ctx.close();
  }

  // 02 library
  {
    const ctx = await browser.newContext({ viewport: MOBILE, colorScheme: "dark", isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await ready(page);
    await goLibrary(page);
    await shot(page, "02-library.png");
    await ctx.close();
  }

  // 03 fridge
  {
    const ctx = await browser.newContext({ viewport: MOBILE, colorScheme: "dark", isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await ready(page);
    await goFridge(page);
    await shot(page, "03-fridge.png");
    await ctx.close();
  }

  // 04 config / membership top
  {
    const ctx = await browser.newContext({ viewport: MOBILE, colorScheme: "dark", isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await ready(page);
    await goSettings(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "04-settings.png");
    await ctx.close();
  }

  // 05 home light-ish (after config preset if possible)
  {
    const ctx = await browser.newContext({ viewport: MOBILE, colorScheme: "light", isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await ready(page);
    await goHome(page);
    await shot(page, "05-discover-light.png");
    await ctx.close();
  }

  await browser.close();
  console.log("CookXpert mobile captures complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
