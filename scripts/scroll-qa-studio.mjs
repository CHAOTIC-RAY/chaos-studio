#!/usr/bin/env node
import { chromium, devices } from "playwright";

const BASE = process.env.STUDIO_URL || "http://127.0.0.1:8802/studio/";
const views = [
  { name: "1024", width: 1024, height: 640 },
  { name: "1440", width: 1440, height: 900 },
  { name: "390", ...devices["iPhone 12"].viewport, height: 844 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2500);
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  let y = 0;
  let wheelMoved = false;

  if (v.name === "390") {
    const start = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(200);
    wheelMoved = (await page.evaluate(() => window.scrollY)) > start + 40;
    for (let i = 0; i < 55; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
      await page.waitForTimeout(100);
      y = await page.evaluate(() => window.scrollY);
    }
    if (y < maxY - 200) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
      y = await page.evaluate(() => window.scrollY);
    }
  } else {
    await page.mouse.move(v.width / 2, v.height / 2);
    const start = await page.evaluate(() => window.scrollY);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(80);
    }
    wheelMoved = (await page.evaluate(() => window.scrollY)) > start + 40;
    for (let i = 0; i < 28; i++) {
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(70);
      y = await page.evaluate(() => window.scrollY);
    }
    if (y < maxY - 200) {
      await page.keyboard.press("End");
      await page.waitForTimeout(400);
      y = await page.evaluate(() => window.scrollY);
    }
  }

  let reachedFooter = false;
  if (v.name === "390") {
    await page.locator("#studio-contact").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    reachedFooter = await page.evaluate(() => {
      const f = document.querySelector("#studio-contact");
      if (!f) return false;
      const r = f.getBoundingClientRect();
      return r.top < window.innerHeight * 0.85;
    });
    y = await page.evaluate(() => window.scrollY);
  }
  const ok = v.name === "390" ? reachedFooter : y >= maxY - 120;
  results.push({ view: v.name, scrollY: y, maxY, wheelMoved, ok });
  await page.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ results, pass: failed.length === 0 }, null, 2));
process.exit(failed.length ? 1 : 0);