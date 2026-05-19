import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "frontend/public/assets/site.config.json");
const publicRoot = join(root, "frontend/public");

const config = JSON.parse(readFileSync(configPath, "utf8"));
const paths = new Set();

function collect(obj) {
  if (typeof obj === "string" && obj.startsWith("/assets/")) {
    paths.add(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach(collect);
  } else if (obj && typeof obj === "object") {
    Object.values(obj).forEach(collect);
  }
}

collect(config);

let failed = false;
for (const p of paths) {
  const file = join(publicRoot, p.replace(/^\/assets\//, "assets/"));
  if (!existsSync(file)) {
    console.error(`Missing asset: ${p} (${file})`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`OK: ${paths.size} asset paths verified.`);
