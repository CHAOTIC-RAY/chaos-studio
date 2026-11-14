#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildGallerySnapshot } from "./lib/gallery-snapshot.mjs";

const root = process.cwd();
const publicDir = join(root, "frontend", "public");
const distDir = join(root, "frontend", "dist");

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
cpSync(publicDir, distDir, { recursive: true });

spawnSync("node", ["scripts/concat-studio-css.mjs"], { stdio: "inherit", cwd: root });
spawnSync("node", ["scripts/minify-studio-assets.mjs"], { stdio: "inherit", cwd: root });
const csDist = join(distDir, "cs");
cpSync(join(publicDir, "cs", "studio.min.css"), join(csDist, "studio.min.css"));
for (const file of [
  "v3-hyper.min.js",
  "studio-cms-client.min.js",
  "studio-packages.min.js",
  "studio-services.min.js",
  "studio-dot-icons.min.js",
  "showcase.min.js",
  "app.min.js",
  "contact-glyphs.min.js",
  "studio-icons.min.js",
  "dot-numerals.min.js",
  "dot-matrix-text.min.js",
]) {
  cpSync(join(publicDir, "cs", file), join(csDist, file));
}

const snapshot = buildGallerySnapshot(root);
writeFileSync(join(distDir, "gallery-snapshot.json"), `${JSON.stringify(snapshot)}\n`);
writeFileSync(join(distDir, "cs", "gallery-snapshot.json"), `${JSON.stringify(snapshot)}\n`);
console.log("Wrote gallery-snapshot.json → frontend/dist/");
console.log("Static assets → frontend/dist/");
