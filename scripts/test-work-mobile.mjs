import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:8799";
const art = "/opt/cursor/artifacts";

for (const width of [360, 390, 430]) {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  await page.goto(`${base}/studio/`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector("#showcase-grid .feat");
  await page.locator("#work").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const audit = await page.evaluate(() => {
    const doc = document.documentElement;
    const feats = [...document.querySelectorAll(".featured-bento .feat")];
    const wrap = document.querySelector(".showcase-strip .wrap");
    const wRect = wrap?.getBoundingClientRect();
    return {
      scrollW: doc.scrollWidth,
      vw: window.innerWidth,
      wrapLeft: wRect?.left,
      wrapWidth: wRect?.width,
      feats: feats.length,
      bad: feats.filter((f) => f.getBoundingClientRect().right > window.innerWidth + 2).length,
    };
  });
  await page.locator(".showcase-strip").screenshot({ path: `${art}/work-mobile-${width}.png` });
  console.log(`work-${width}`, JSON.stringify(audit));
  await browser.close();
}
