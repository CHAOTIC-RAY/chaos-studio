import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:8799";
const art = "/opt/cursor/artifacts";

for (const [w, h, name, throttle, heroWait] of [
  [360, 800, "hero-mobile-360", 4, 4500],
  [390, 844, "hero-mobile-390", 4, 4500],
  [430, 932, "hero-mobile-430", 4, 4500],
  [1280, 720, "hero-desktop-1280", 1, 3500],
]) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await context.newPage();
  if (throttle > 1) {
    const client = await context.newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  }
  await page.goto(`${base}/studio/`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForSelector("#hero-gen-canvas");
  await page.waitForTimeout(heroWait);
  await page.locator(".hero").screenshot({ path: `${art}/${name}.png` });
  await browser.close();
}

{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${base}/studio/#why`, { waitUntil: "networkidle" });
  await page.waitForSelector(".why-bento");
  await page.evaluate(() => document.querySelector("#why")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(800);
  const audit = await page.evaluate(() => ({
    grow2: !!document.getElementById("grow2"),
    bento: document.querySelectorAll("[data-why-card]").length,
    marqueeItems: document.querySelectorAll(".v3-marquee__item").length,
    marqueeAnton: getComputedStyle(document.querySelector(".v3-marquee__item") || document.body).fontFamily,
  }));
  await page.locator(".whys").screenshot({ path: `${art}/why-mobile-390.png` });
  console.log("why-mobile-390", JSON.stringify(audit));
  await browser.close();
}
