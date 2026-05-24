/**
 * Browser check for portfolio campaign / feed section.
 * Usage: node scripts/check-live-portfolio.mjs [url]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.argv[2] || "https://portfolio.chaoticstudio.workers.dev/";
const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "artifacts", "browser-check");
fs.mkdirSync(outDir, { recursive: true });

const { chromium } = await import("playwright");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const issues = [];

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(outDir, "01-hero.png"), fullPage: false });

  const postsSection = page.locator("#posts, .posts-panel, [class*='posts']").first();
  await postsSection.scrollIntoViewIfNeeded({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, "02-campaign-rail.png"), fullPage: false });

  const cards = page.locator(".post-card");
  const count = await cards.count();
  console.log(`Post cards on page: ${count}`);

  const samples = [];
  for (let i = 0; i < Math.min(count, 12); i++) {
    const card = cards.nth(i);
    const title = (await card.locator(".post-card__title").textContent())?.trim() || "";
    const descEl = card.locator(".post-desc");
    const desc =
      (await descEl.count()) > 0 ? (await descEl.textContent())?.trim() || "" : "";
    const tags = await card.locator(".post-tags span").allTextContents();
    const client = (await card.locator(".post-card__client").textContent())?.trim() || "";
    const img = card.locator(".post-card__media img, .post-card__slide img").first();
    const src = (await img.getAttribute("src").catch(() => null)) || "";
    const imgOk = src ? (await page.request.get(new URL(src, url).href)).ok() : false;
    samples.push({ i, client, title, descLen: desc.length, tags, imgOk, src: src.slice(0, 80) });
    if (desc.length > 120) {
      issues.push(`Long description on card ${i} "${title}": ${desc.length} chars`);
    }
    if (!imgOk && src) issues.push(`Broken image on card ${i} "${title}": ${src}`);
  }

  console.log("\n--- Sample cards (rail) ---");
  for (const s of samples) {
    console.log(
      `[${s.i}] ${s.client || "(feed)"} | ${s.title} | desc:${s.descLen}ch | tags:[${s.tags.join(", ")}] | img:${s.imgOk ? "ok" : "FAIL"}`,
    );
  }

  const expandBtn = page.getByRole("button", { name: /browse full feed|expand/i }).or(
    page.locator(".posts-panel__toggle, [data-posts-expand]"),
  );
  if ((await expandBtn.count()) > 0) {
    await expandBtn.first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, "03-feed-expanded.png"), fullPage: false });

    const feedCards = page.locator(".post-card--feed");
    const feedCount = await feedCards.count();
    console.log(`\nExpanded feed cards: ${feedCount}`);

    const feedSamples = [];
    for (let i = 0; i < Math.min(feedCount, 8); i++) {
      const card = feedCards.nth(i);
      const title = (await card.locator(".post-card__title").textContent())?.trim() || "";
      const descEl = card.locator(".post-desc");
    const desc =
      (await descEl.count()) > 0 ? (await descEl.textContent())?.trim() || "" : "";
      const tags = await card.locator(".post-tags span").allTextContents();
      feedSamples.push({ title, descLen: desc.length, tags });
      if (desc.length > 120) issues.push(`Long feed description "${title}": ${desc.length} chars`);
    }
    console.log("\n--- Feed samples ---");
    for (const s of feedSamples) {
      console.log(`  ${s.title} | desc:${s.descLen}ch | [${s.tags.join(", ")}]`);
    }
  } else {
    console.log("\n(No expand feed control found)");
  }

  const longDescs = await page.locator(".post-desc").evaluateAll((els) =>
    els
      .map((el) => ({ text: el.textContent?.trim() || "", len: (el.textContent?.trim() || "").length }))
      .filter((x) => x.len > 80),
  );
  if (longDescs.length) {
    issues.push(`${longDescs.length} post(s) still have descriptions > 80 chars on live site`);
    console.log("\n--- Long descriptions still visible ---");
    longDescs.slice(0, 5).forEach((d) => console.log(`  (${d.len}) ${d.text.slice(0, 100)}…`));
  } else {
    console.log("\n✓ No long post descriptions visible in DOM");
  }

  console.log(`\nScreenshots: ${outDir}`);
  if (issues.length) {
    console.log("\nIssues:");
    issues.forEach((x) => console.log("  -", x));
    process.exitCode = 1;
  } else {
    console.log("\n✓ Browser check passed");
  }
} finally {
  await browser.close();
}
