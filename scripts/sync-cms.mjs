#!/usr/bin/env node
/** Build standalone CMS app (alias for build-cms.mjs). */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync("node", ["scripts/build-cms.mjs"], { cwd: root, stdio: "inherit" });
process.exit(r.status ?? 1);
