#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";

const url = process.env.STUDIO_URL || "http://127.0.0.1:8802/studio/";
const outDir = "/opt/cursor/artifacts/lighthouse-mobile";
mkdirSync(outDir, { recursive: true });
const reportPath = `${outDir}/report.json`;

const r = spawnSync(
  "npx",
  ["--yes", "lighthouse", url, "--quiet", "--chrome-flags=--headless", "--only-categories=performance,accessibility,best-practices", "--form-factor=mobile", "--screenEmulation.mobile", "--output=json", `--output-path=${reportPath}`],
  { encoding: "utf8", timeout: 180000 },
);

if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status || 1);
}

const data = JSON.parse(readFileSync(reportPath, "utf8"));
const scores = {};
for (const [k, v] of Object.entries(data.categories || {})) {
  scores[k] = Math.round((v.score || 0) * 100);
}
console.log(JSON.stringify({ url, scores, reportPath }, null, 2));