/**
 * Import CookXpert & Forge logos from AppLogos.zip into public/images/projects/logos/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = path.resolve(process.argv[2] ?? path.join(root, "AppLogos.zip"));
const outDir = path.join(root, "frontend/public/images/projects/logos");

const MAP = [
  ["cookxpert logo.png", "cookxpert.png"],
  ["forge logo.png", "forge.png"],
];

function main() {
  if (!fs.existsSync(zipPath)) {
    console.error("Zip not found:", zipPath);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "app-logos-"));
  execSync(`unzip -q -o "${zipPath}" -d "${tmp}"`);
  for (const [srcName, destName] of MAP) {
    const src = path.join(tmp, srcName);
    if (!fs.existsSync(src)) throw new Error(`Missing: ${srcName}`);
    fs.copyFileSync(src, path.join(outDir, destName));
    console.log("→", destName);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

main();
