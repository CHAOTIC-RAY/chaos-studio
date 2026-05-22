/**
 * Import app screenshots from Faisa.zip into portfolio frame folders.
 * Desktop (~1678px wide) → cookxpert + forge; narrow (~335–401px) → faisa only.
 *
 * Usage: node scripts/import-faisa-zip.mjs [path/to/Faisa.zip]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = path.resolve(process.argv[2] ?? path.join(root, "Faisa.zip"));
const projects = path.join(root, "frontend/public/images/projects");

const COOKXPERT = [
  ["Screenshot 2026-05-23 022105.png", "01-discover-dark.png"],
  ["Screenshot 2026-05-23 021900.png", "02-discover-light.png"],
  ["Screenshot 2026-05-23 021717.png", "03-library.png"],
  ["Screenshot 2026-05-23 021748.png", "04-notifications.png"],
  ["Screenshot 2026-05-23 022009.png", "05-settings-appearance-dark.png"],
  ["Screenshot 2026-05-23 022027.png", "06-settings-appearance-light.png"],
  ["Screenshot 2026-05-23 021957.png", "07-settings-membership.png"],
  ["Screenshot 2026-05-23 021935.png", "08-fridge.png"],
];

const FORGE = [
  ["Screenshot 2026-05-23 023013.png", "01-profile.png"],
  ["Screenshot 2026-05-23 023024.png", "02-dashboard.png"],
  ["Screenshot 2026-05-23 023052.png", "03-calendar.png"],
  ["Screenshot 2026-05-23 023115.png", "04-scheduling.png"],
  ["Screenshot 2026-05-23 023127.png", "05-ideas.png"],
  ["Screenshot 2026-05-23 023224.png", "06-idea-board.png"],
  ["Screenshot 2026-05-23 023251.png", "07-hook-generator.png"],
  ["Screenshot 2026-05-23 023334.png", "08-trends.png"],
];

/** Chronological zip order; carousel order is set in render.ts (FAISA_FRAMES). */
const FAISA = [
  ["Screenshot 2026-05-23 022238.png", "01-splash.png"],
  ["Screenshot 2026-05-23 022310.png", "02-home.png"],
  ["Screenshot 2026-05-23 022414.png", "03-budget.png"],
  ["Screenshot 2026-05-23 022446.png", "04-services.png"],
  ["Screenshot 2026-05-23 022517.png", "05-wallet.png"],
  ["Screenshot 2026-05-23 022537.png", "06-transfer.png"],
  ["Screenshot 2026-05-23 022612.png", "07-receipt.png"],
  ["Screenshot 2026-05-23 022633.png", "08-create-account.png"],
  ["Screenshot 2026-05-23 022813.png", "09-settings.png"],
];

function copyMapped(srcDir, destDir, pairs) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const [srcName, destName] of pairs) {
    const src = path.join(srcDir, srcName);
    const dest = path.join(destDir, destName);
    if (!fs.existsSync(src)) throw new Error(`Missing in zip: ${srcName}`);
    fs.copyFileSync(src, dest);
    console.log("→", path.relative(projects, dest));
  }
}

function main() {
  if (!fs.existsSync(zipPath)) {
    console.error("Zip not found:", zipPath);
    process.exit(1);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "faisa-import-"));
  execSync(`unzip -q -o "${zipPath}" -d "${tmp}"`);
  const base = path.join(tmp, "app screenshots");

  copyMapped(path.join(base, "Cookxperts"), path.join(projects, "frames/cookxpert/desktop"), COOKXPERT);
  copyMapped(path.join(base, "Forge"), path.join(projects, "frames/forge/desktop"), FORGE);
  copyMapped(path.join(base, "FaisamobileXyz"), path.join(projects, "frames/faisa"), FAISA);

  const heroCook = path.join(projects, "frames/cookxpert/desktop/01-discover-dark.png");
  const heroForge = path.join(projects, "frames/forge/desktop/02-dashboard.png");
  const heroFaisa = path.join(projects, "frames/faisa/02-home.png");
  fs.copyFileSync(heroCook, path.join(projects, "cookxpert_desktop.png"));
  fs.copyFileSync(heroForge, path.join(projects, "forge_desktop.png"));
  fs.copyFileSync(heroFaisa, path.join(projects, "faisa_mobile.png"));

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("Import complete.");
}

main();
