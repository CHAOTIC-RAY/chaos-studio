#!/usr/bin/env node
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.STUDIO_URL || "http://127.0.0.1:8802/studio/";
const out = "/opt/cursor/artifacts";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(2000);

async function cap(name, sel) {
  const loc = page.locator(sel).first();
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const path = `${out}/${name}`;
  if (sel === "#top" || sel === ".hero") {
    await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  } else {
    await loc.screenshot({ path });
  }
  return path;
}

const shots = {
  heroNav: await cap("mobile-hero-nav-390.png", "#top"),
  about: await cap("mobile-about-390.png", ".about"),
  packages: await cap("mobile-packages-390.png", "#packages"),
  work: await cap("mobile-work-390.png", "#work"),
};

await browser.close();
console.log(JSON.stringify(shots, null, 2));