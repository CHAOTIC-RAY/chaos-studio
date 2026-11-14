#!/usr/bin/env node
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.STUDIO_URL || "http://127.0.0.1:8802/studio/";
const out = "/opt/cursor/artifacts";
mkdirSync(out, { recursive: true });

const views = [
  { name: "m320", width: 320, height: 800 },
  { name: "m390", ...devices["iPhone 12"].viewport, height: 844 },
  { name: "d1440", width: 1440, height: 900 },
];

const sections = ["#top", "#work", ".svc", "#packages", ".imp", "#studio-contact"];

async function shot(page, name, sel) {
  const el = await page.locator(sel).first();
  if (!(await el.count())) return null;
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const path = `${out}/audit-${name}-${sel.replace(/[^a-z]+/gi, "-")}.png`;
  await el.screenshot({ path });
  return path;
}

const browser = await chromium.launch();
const report = { overflow: [], packagesVisible: null, reduced: null };

for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);
  const overflow = await page.evaluate(() => {
    const w = document.documentElement.scrollWidth;
    const vw = window.innerWidth;
    return { w, vw, bad: w > vw + 1 };
  });
  report.overflow.push({ view: v.name, ...overflow });

  for (const sel of sections) {
    await shot(page, v.name, sel);
  }

  if (v.name === "m390") {
    await page.locator("#packages").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    report.packagesVisible = await page.evaluate(() => {
      const pk = [...document.querySelectorAll(".pk-bento .pk")];
      return pk.map((el) => {
        const s = getComputedStyle(el);
        return { opacity: s.opacity, display: s.display, h: el.offsetHeight };
      });
    });
  }
  await page.close();
}

const rmPage = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
await rmPage.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
await rmPage.waitForTimeout(1500);
report.reduced = await rmPage.evaluate(() => ({
  packages: [...document.querySelectorAll(".pk-bento .pk")].every((el) => getComputedStyle(el).opacity === "1"),
  reveals: [...document.querySelectorAll("[data-reveal]")].every((el) => getComputedStyle(el).opacity === "1"),
}));
await shot(rmPage, "m390-rm", "#packages");
await rmPage.close();
await browser.close();

console.log(JSON.stringify(report, null, 2));