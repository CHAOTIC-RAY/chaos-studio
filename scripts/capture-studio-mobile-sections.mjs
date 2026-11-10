/**
 * 390px screenshots — one per major section.
 * BASE_URL=http://127.0.0.1:8799 node scripts/capture-studio-mobile-sections.mjs
 */
import fs from "node:fs";
import path from "node:path";

const artDir = "/opt/cursor/artifacts";
fs.mkdirSync(artDir, { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:8799";

const shots = [
  { name: "studio-sec-hero-390.png", y: 0 },
  { name: "studio-sec-about-390.png", y: 780 },
  { name: "studio-sec-work-390.png", y: 1650 },
  { name: "studio-sec-services-390.png", y: 2900 },
  { name: "studio-sec-pricing-390.png", y: 5200 },
  { name: "studio-sec-impact-390.png", y: 6800 },
  { name: "studio-sec-contact-390.png", y: 8200 },
];

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const vp = { width: 390, height: 844 };
  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/studio/`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(3500);
  window.ChaosDotMatrixText && null;
  for (const s of shots) {
    await page.evaluate((y) => window.scrollTo(0, y), s.y);
    await page.waitForTimeout(600);
    const out = path.join(artDir, s.name);
    await page.screenshot({ path: out, type: "png" });
    console.log(out);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
