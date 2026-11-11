import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:8799";
const art = "/opt/cursor/artifacts";

async function shot(page, name, sel, scroll) {
  if (scroll) await page.locator(scroll).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator(sel).screenshot({ path: `${art}/${name}.png` });
}

for (const [w, tag] of [
  [390, "mobile-390"],
  [1280, "desktop-1280"],
]) {
  const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage({ viewport: { width: w, height: w === 390 ? 844 : 900 } });
  await page.goto(`${base}/studio/`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector(".svc-bento");
  await shot(page, `services-${tag}.png`, ".svc", ".svc");
  await shot(page, `packages-${tag}.png`, ".pks-sec", "#packages");
  const hero = await page.evaluate(() => {
    const c = document.getElementById("hero-gen-canvas");
    return { w: c?.width, clipCount: fetch ? null : null };
  });
  const clipList = await page.evaluate(async () => {
    const r = await fetch("/assets/hero-clips/manifest.json");
    const m = await r.json();
    return m.clips.map((c) => c.id);
  });
  await page.waitForSelector("#hero-gen-canvas");
  await page.waitForTimeout(5000);
  await page.locator(".hero").screenshot({ path: `${art}/hero-midframe-${tag}.png` });
  const audit = await page.evaluate(() => ({
    svcDotIcons: document.querySelectorAll(".svc-bento .svc-ico .dot-icon").length,
    pkDotIcons: document.querySelectorAll(".pk-dot-icon .dot-icon").length,
    svcNums: document.querySelectorAll(".svc-bento .dot-num").length,
    pkListNums: [...document.querySelectorAll(".pk-bento .pk li span:first-child")].filter((el) => /^\d+$/.test(el.textContent.trim())).length,
    whyDotIcons: document.querySelectorAll(".why-dot-ico .dot-icon").length,
    scrollW: document.documentElement.scrollWidth,
    vw: innerWidth,
  }));
  console.log(tag, JSON.stringify({ ...audit, hero, clipList }));
  await browser.close();
}
