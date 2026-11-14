#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { transformSync } from "esbuild";
import CleanCSS from "clean-css";

const root = process.cwd();
const cs = join(root, "frontend", "public", "cs");

const cssParts = ["chaos-tokens.css", "chaos-components.css", "chaos-sections.css", "studio-audit.css"];
const combined = cssParts.map((f) => readFileSync(join(cs, f), "utf8")).join("\n");
const minified = new CleanCSS({ level: 2 }).minify(combined);
if (minified.errors.length) {
  console.warn("CSS minify warnings:", minified.errors.slice(0, 3));
}
writeFileSync(join(cs, "studio.min.css"), minified.styles);
console.log(
  "studio.min.css",
  Math.round(combined.length / 1024),
  "KiB →",
  Math.round(minified.styles.length / 1024),
  "KiB",
);

const jsMinify = [
  "contact-glyphs.js",
  "studio-cms-client.js",
  "studio-icons.js",
  "studio-dot-icons.js",
  "dot-numerals.js",
  "dot-matrix-text.js",
  "app.js",
  "studio-services.js",
  "studio-packages.js",
  "showcase.js",
  "v3-hyper.js",
];

for (const file of jsMinify) {
  const p = join(cs, file);
  const code = readFileSync(p, "utf8");
  const out = transformSync(code, { minify: true, target: "es2020", loader: "js" });
  if (!out.code) throw new Error(`minify failed: ${file}`);
  writeFileSync(p.replace(/\.js$/, ".min.js"), out.code);
}

console.log("Wrote", jsMinify.length, "*.min.js");