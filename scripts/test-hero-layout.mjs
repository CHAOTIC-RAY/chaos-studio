import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:8799";
const art = "/opt/cursor/artifacts";

for (const [w, h, name, throttle] of [
  [390, 844, "hero-mobile-390", 4],
  [1280, 720, "hero-desktop-1280", 1],
]) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.goto(`${base}/studio/`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForSelector("#hero-gen-canvas");
  await page.waitForTimeout(w === 390 ? 4500 : 3500);
  const audit = await page.evaluate(() => {
    const chaos = document.querySelector(".hero-h .glitch")?.getBoundingClientRect();
    const studio = document.querySelector(".hero-studio")?.getBoundingClientRect();
    const overlap = chaos && studio ? studio.top < chaos.bottom - 2 : false;
    return {
      pill: !!document.querySelector(".hero-st"),
      brief: !!document.querySelector(".redact-brief"),
      dottedHero: !!document.querySelector(".hero-h [data-dot-text]"),
      solidWm: document.querySelector(".hdr .wordmark-studio--solid") != null,
      visibleTapes: [...document.querySelectorAll(".frame .tape")].filter(
        (el) => getComputedStyle(el).display !== "none",
      ).length,
      scrollW: document.documentElement.scrollWidth,
      vw: window.innerWidth,
      studioBelowChaos: studio && chaos ? studio.top >= chaos.bottom - 4 : null,
      overlap,
    };
  });
  await page.locator(".hero").screenshot({ path: `${art}/${name}.png` });
  console.log(name, JSON.stringify(audit, null, 2));
  await browser.close();
}
