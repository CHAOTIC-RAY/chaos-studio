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

const snapshot = buildGallerySnapshot(root);
writeFileSync(join(distDir, "gallery-snapshot.json"), `${JSON.stringify(snapshot)}\n`);
writeFileSync(join(distDir, "cs", "gallery-snapshot.json"), `${JSON.stringify(snapshot)}\n`);
console.log("Wrote gallery-snapshot.json → frontend/dist/");
console.log("Static assets → frontend/dist/");
