#!/usr/bin/env node
/** Merge studio page stylesheets into tokens / components / sections bundles. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const cs = join(process.cwd(), "frontend", "public", "cs");

const tokens = ["base.css", "brand-v3-2026.css"];
const components = [
  "contact-chrome.css",
  "dot-matrix-type.css",
  "dot-icon-visible.css",
  "studio-cleanup.css",
  "edge.css",
];
const sections = [
  "studio.css",
  "v3-hyper.css",
  "hero-generative.css",
  "hero-layout.css",
  "v3-studio-bento.css",
  "v3-cinema.css",
  "why-section.css",
  "showcase.css",
  "showcase-devices.css",
  "gallery.css",
];
const tail = ["studio-audit.css"];

function read(name) {
  return `/* === ${name} === */\n${readFileSync(join(cs, name), "utf8")}\n`;
}

function bundle(files, out) {
  writeFileSync(join(cs, out), files.map(read).join("\n"), "utf8");
  console.log("Wrote", out, `(${files.length} parts)`);
}

mkdirSync(cs, { recursive: true });
bundle(tokens, "chaos-tokens.css");
bundle(components, "chaos-components.css");
bundle(sections, "chaos-sections.css");

writeFileSync(
  join(cs, "studio-bundle.css"),
  ["chaos-tokens.css", "chaos-components.css", "chaos-sections.css", ...tail]
    .map((f) => `@import url("/cs/${f}");`)
    .join("\n"),
  "utf8",
);

console.log("Wrote studio-bundle.css");