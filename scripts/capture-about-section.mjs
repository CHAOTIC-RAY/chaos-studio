#!/usr/bin/env node
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.STUDIO_URL || "http://127.0.0.1:8802/studio/";
const out = "/opt/cursor/artifacts";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(page, name) {
  const about = page.locator(".about");
  await about.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const path = `${out}/${name}`;
  await about.screenshot({ path });
  return path;
}

const d = await browser.newPage({ viewport: { width: 1024, height: 720 } });
await d.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
await d.evaluate(() => window.scrollTo(0, document.querySelector(".about")?.offsetTop - 120 || 0));
await d.waitForTimeout(200);
await d.screenshot({ path: `${out}/about-section-d1024-midscroll.png`, clip: { x: 0, y: 0, width: 1024, height: 720 } });
await d.waitForTimeout(900);
const d1 = await shot(d, "about-section-d1024.png");
await d.close();

const m = await browser.newPage({ viewport: devices["iPhone 12"].viewport });
await m.setViewportSize({ width: 390, height: 844 });
await m.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
await m.waitForTimeout(1500);
const m1 = await shot(m, "about-section-m390.png");
await m.close();

await browser.close();
console.log(JSON.stringify({ desktop: d1, desktopMid: `${out}/about-section-d1024-midscroll.png`, mobile: m1 }, null, 2));