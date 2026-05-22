/**
 * Import NEW SS/ from AppScreenshots.zip (Google Drive app screenshots update).
 * Merges with existing Faisa.zip desktop sets via import:faisa first.
 *
 * Usage:
 *   npm run import:faisa
 *   node scripts/import-app-screenshots.mjs [path/to/AppScreenshots.zip]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = path.resolve(process.argv[2] ?? path.join(root, "AppScreenshots.zip"));
const projects = path.join(root, "frontend/public/images/projects");

const COOKXPERT_MOBILE = [
  ["Screenshot 2026-05-23 034525.png", "01-discover-dark.png"],
  ["Screenshot 2026-05-23 034632.png", "02-discover-light.png"],
  ["Screenshot 2026-05-23 034657.png", "03-library.png"],
  ["Screenshot 2026-05-23 034716.png", "04-notifications.png"],
  ["Screenshot 2026-05-23 034744.png", "05-settings-appearance-dark.png"],
  ["Screenshot 2026-05-23 034809.png", "06-settings-appearance-light.png"],
  ["Screenshot 2026-05-23 034842.png", "07-settings-membership.png"],
  ["Screenshot 2026-05-23 034906.png", "08-fridge.png"],
];

const COOKXPERT_DESKTOP_NEW = [
  ["Screenshot 2026-05-23 034931.png", "09-recipe-detail.png"],
];

const FORGE_MOBILE = [
  ["Screenshot 2026-05-23 035047.png", "01-profile.png"],
  ["Screenshot 2026-05-23 035100.png", "02-dashboard.png"],
  ["Screenshot 2026-05-23 035128.png", "03-scheduling.png"],
];

function findDir(tmp, pattern) {
  const base = path.join(tmp, "NEW SS");
  if (!fs.existsSync(base)) throw new Error("Expected NEW SS/ in zip");
  const entries = fs.readdirSync(base, { withFileTypes: true });
  const hit = entries.find((e) => e.isDirectory() && pattern.test(e.name));
  if (!hit) throw new Error(`Folder not found: ${pattern}`);
  return path.join(base, hit.name);
}

function copyMapped(srcDir, destDir, pairs) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const [srcName, destName] of pairs) {
    const src = path.join(srcDir, srcName);
    const dest = path.join(destDir, destName);
    if (!fs.existsSync(src)) throw new Error(`Missing: ${src}`);
    fs.copyFileSync(src, dest);
    console.log("→", path.relative(projects, dest));
  }
}

function main() {
  if (!fs.existsSync(zipPath)) {
    console.error("Zip not found:", zipPath);
    process.exit(1);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "app-ss-"));
  execSync(`unzip -q -o "${zipPath}" -d "${tmp}"`);

  const cookMobile = findDir(tmp, /cookxpert mobile/i);
  const cookDesktop = findDir(tmp, /cookxpert desktop/i);
  const forgeMobile = findDir(tmp, /forge mobi/i);

  copyMapped(cookMobile, path.join(projects, "frames/cookxpert/mobile"), COOKXPERT_MOBILE);
  copyMapped(cookDesktop, path.join(projects, "frames/cookxpert/desktop"), COOKXPERT_DESKTOP_NEW);
  copyMapped(forgeMobile, path.join(projects, "frames/forge/mobile"), FORGE_MOBILE);

  fs.copyFileSync(
    path.join(projects, "frames/cookxpert/mobile/01-discover-dark.png"),
    path.join(projects, "cookxpert_mobile.png"),
  );
  fs.copyFileSync(
    path.join(projects, "frames/forge/mobile/02-dashboard.png"),
    path.join(projects, "forge_mobile.png"),
  );

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("App screenshots import complete.");
}

main();
