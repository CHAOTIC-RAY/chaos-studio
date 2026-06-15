#!/usr/bin/env node
/** Sync all CMS mirrors and generated admin assets. */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const args of [
  ["scripts/vendor-decap.mjs"],
  ["scripts/sync-content.mjs"],
  ["scripts/generate-media-manifest.mjs"],
]) {
  const r = spawnSync("node", args, { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("CMS sync complete (social/gallery posts mirrors + media manifest).");
