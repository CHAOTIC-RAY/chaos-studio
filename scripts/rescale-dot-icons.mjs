#!/usr/bin/env node
/**
 * Halftone dot icons at 48×48 user units: ~2.5px pitch, ~1.1px dot diameter at 1:1 CSS px.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "frontend/public/assets/motifs/dot-icons");
const VB = 48;
const DOT_R = 0.55;
const FILL = "#D690E8";

const circleRe = /circle\s+cx="([^"]+)"\s+cy="([^"]+)"\s+r="[^"]+"/g;

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const p = path.join(dir, file);
  let raw = fs.readFileSync(p, "utf8");
  const circles = [...raw.matchAll(circleRe)];
  if (!circles.length) {
    console.warn("skip", file);
    continue;
  }
  const dots = circles
    .map((m) => {
      let cx = parseFloat(m[1]);
      let cy = parseFloat(m[2]);
      if (cx <= 24.5 && cy <= 24.5) {
        cx *= 2;
        cy *= 2;
      }
      return `<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${DOT_R}"/>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}" fill="${FILL}">${dots}</svg>\n`;
  fs.writeFileSync(p, svg);
}
console.log("rescaled dot-icons in", dir);
