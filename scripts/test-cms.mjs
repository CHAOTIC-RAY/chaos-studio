#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("Running CMS sync (sync-content)");
run("node", ["scripts/sync-content.mjs"]);

console.log("Running CMS verification (verify-cms-sync)");
run("node", ["scripts/verify-cms-sync.mjs"]);

console.log("CMS tests passed.");
