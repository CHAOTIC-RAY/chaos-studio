/**
 * Capture CookXpert UI screenshots for portfolio (matches designer exports).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://cookxpert.chaoticstudio.workers.dev";
const outDir = path.join(root, "frontend/public/images/projects");
const framesDir = path.join(outDir, "frames/cookxpert");
const WAIT = 12000;

async function ready(page) {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(WAIT);
}

async function openAiChat(page) {
  const buttons = await page.locator("button").all();
  for (const b of buttons) {
    const box = await b.boundingBox();
    if (box && box.y > 500 && box.width > 40) {
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

async function goConfig(page) {
  await page.getByRole("button", { name: "Go to Config" }).click();
  await page.waitForTimeout(2500);
}

async function shot(page, file) {
  const full = path.join(framesDir, file);
  await page.screenshot({ path: full, type: "png" });
  console.log("saved", file);
}

async function clickPreset(page, name) {
  const preset = page.getByText(name, { exact: true });
  if ((await preset.count()) > 0) {
    await preset.first().click();
    await page.waitForTimeout(1200);
  }
}

async function setDarkMode(page, on) {
  const row = page.getByText(/Dark Mode|Light Mode/i).first();
  const toggle = row.locator("..").locator("button, [role='switch']").last();
  if ((await toggle.count()) > 0) {
    const label = await row.textContent();
    const isDark = /dark/i.test(label ?? "");
    if (isDark !== on) await toggle.click();
    await page.waitForTimeout(1500);
  }
}

async function main() {
  const { chromium } = await import("playwright");
  fs.mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const vp = { width: 1280, height: 800 };

  // 01 — Discover dark + AI chat (desktop hero)
  {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: "dark" });
    const page = await ctx.newPage();
    await ready(page);
    await openAiChat(page);
    await page.screenshot({ path: path.join(outDir, "cookxpert_desktop.png"), type: "png" });
    await shot(page, "01-discover-dark.png");
    await ctx.close();
  }

  // Mobile discover + AI
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
      isMobile: true,
    });
    const page = await ctx.newPage();
    await ready(page);
    await openAiChat(page);
    await page.screenshot({ path: path.join(outDir, "cookxpert_mobile.png"), type: "png" });
    await ctx.close();
  }

  // 05 — Settings membership / cloud (top of config)
  {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: "dark" });
    const page = await ctx.newPage();
    await ready(page);
    await goConfig(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "05-settings-membership.png");
    await ctx.close();
  }

  // 03 — Appearance dark (Nothing v1)
  {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: "dark" });
    const page = await ctx.newPage();
    await ready(page);
    await goConfig(page);
    await setDarkMode(page, true);
    await clickPreset(page, "Nothing v1");
    const appearance = page.getByText("Appearance", { exact: true });
    if ((await appearance.count()) > 0) {
      await appearance.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
    }
    await shot(page, "03-settings-appearance-dark.png");
    await ctx.close();
  }

  // 04 — Appearance light + Neumorph
  {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: "light" });
    const page = await ctx.newPage();
    await ready(page);
    await goConfig(page);
    await setDarkMode(page, false);
    await clickPreset(page, "Neumorph");
    const appearance = page.getByText("Appearance", { exact: true });
    if ((await appearance.count()) > 0) {
      await appearance.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
    }
    await shot(page, "04-settings-appearance-light.png");
    await ctx.close();
  }

  // 02 — Discover light (Nothing v1 / neo-brutalist)
  {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: "light" });
    const page = await ctx.newPage();
    await ready(page);
    await goConfig(page);
    await clickPreset(page, "Nothing v1");
    await setDarkMode(page, false);
    await goHome(page);
    await page.waitForTimeout(2000);
    await shot(page, "02-discover-light.png");
    await ctx.close();
  }

  // 06 — Fridge
  {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: "dark" });
    const page = await ctx.newPage();
    await ready(page);
    await goFridge(page);
    await shot(page, "06-fridge.png");
    await ctx.close();
  }

  // Remove legacy frame files
  for (const legacy of ["01-discover.png", "02-library.png", "02-fridge.png", "02-home.png"]) {
    const p = path.join(framesDir, legacy);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  await browser.close();
  console.log("CookXpert captures complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
