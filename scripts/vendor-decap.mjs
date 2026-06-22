#!/usr/bin/env node
/** Copy Sveltia CMS bundle for same-origin /admin/ (avoids CDN tracking/storage blocks). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules/sveltia-cms/dist/sveltia-cms.js");
const dest = path.join(root, "cms/dist/sveltia-cms.js");

if (!fs.existsSync(src)) {
  console.error("sveltia-cms not installed — run npm ci");
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("Vendored sveltia-cms -> cms/dist/sveltia-cms.js");