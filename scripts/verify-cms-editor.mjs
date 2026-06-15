#!/usr/bin/env node
/**
 * Verify Decap editor layout: form fields visible and EditorContainer has height.
 * Mocks GitHub API — no real token required.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "../cms/dist");
const PORT = 4173;
const HASH = "#/collections/campaign/entries/campaign-meta";
const CAMPAIGN_META = JSON.stringify({ subtitle: "Test subtitle" });

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".yml": "text/yaml",
  ".json": "application/json",
  ".png": "image/png",
};

function serve(req, res) {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  let path = url.pathname;
  if (path === "/editor-frame") path = "/editor-frame.html";
  const filePath = join(ROOT, path.replace(/^\//, ""));
  readFile(filePath)
    .then((buf) => {
      res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
      res.end(buf);
    })
    .catch(() => {
      res.writeHead(404);
      res.end("not found");
    });
}

const server = createServer(serve);
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const { chromium } = await import("playwright");

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.route("**/api.github.com/**", async (route) => {
  const url = route.request().url();
  if (url.includes("/user")) {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ login: "test-user", name: "Test User" }),
    });
  }
  if (url.includes("/repos/CHAOTIC-RAY/portfolio/contents/content/campaign-meta.json")) {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: Buffer.from(CAMPAIGN_META).toString("base64"),
        encoding: "base64",
        sha: "abc123",
      }),
    });
  }
  return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
});

const decapUser = JSON.stringify({
  token: "fake-test-token",
  login: "test-user",
  name: "Test User",
});

for (const path of ["/editor-frame", "/"]) {
  await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: "domcontentloaded" });
  await page.evaluate((user) => localStorage.setItem("decap-cms-user", user), decapUser);
  await page.goto(`http://127.0.0.1:${PORT}${path}${HASH}`, { waitUntil: "networkidle" });

  await page.waitForTimeout(4000);

  const result = await page.evaluate(() => {
    const container = document.querySelector('[class*="EditorContainer"]');
    const input = document.querySelector("#nc-root input, #nc-root textarea");
    const cs = container ? getComputedStyle(container) : null;
    const inputCs = input ? getComputedStyle(input) : null;
    return {
      hasContainer: Boolean(container),
      containerHeight: cs ? Math.round(container.getBoundingClientRect().height) : 0,
      containerPosition: cs?.position,
      containerOverflow: cs?.overflow,
      inputCount: document.querySelectorAll("#nc-root input, #nc-root textarea, #nc-root select").length,
      inputVisible: inputCs ? inputCs.display !== "none" && inputCs.visibility !== "hidden" : false,
      inputRect: input ? Math.round(input.getBoundingClientRect().height) : 0,
      toolbarVisible: Boolean(
        [...document.querySelectorAll('[class*="ToolbarContainer"]')].some(
          (el) => getComputedStyle(el).display !== "none",
        ),
      ),
    };
  });

  console.log(`\n${path}:`);
  console.log(JSON.stringify(result, null, 2));

  if (!result.hasContainer || result.containerHeight < 100) {
    console.error(`FAIL: EditorContainer missing or collapsed on ${path}`);
    process.exitCode = 1;
  }
  if (result.inputCount < 1 || !result.inputVisible) {
    console.error(`FAIL: No visible form fields on ${path}`);
    process.exitCode = 1;
  }
}

await browser.close();
server.close();

if (!process.exitCode) console.log("\nOK: editor layout verified");
