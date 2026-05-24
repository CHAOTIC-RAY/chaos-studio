/**
 * Export worker/src/data/portfolio.ts body to content/portfolio.json (run after editing TS).
 * Prefer editing content/portfolio.json via Decap CMS; re-run only if TS was changed by hand.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsPath = path.join(root, "worker", "src", "data", "portfolio.ts");
const outPath = path.join(root, "content", "portfolio.json");

const src = fs.readFileSync(tsPath, "utf8");
const start = src.indexOf("export const portfolio = ");
if (start < 0) throw new Error("portfolio export not found");
const eq = src.indexOf("{", start);
let depth = 0;
let end = -1;
for (let i = eq; i < src.length; i++) {
  const ch = src[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
if (end < 0) throw new Error("could not parse portfolio object");
let objLiteral = src.slice(eq, end);
objLiteral = objLiteral.replace(/\s+socialPosts:\s*getSocialPosts\(\),?\s*/m, "\n");
objLiteral = objLiteral.replace(/\s+as const\s*$/, "");
const portfolio = Function(`"use strict"; return (${objLiteral});`)();
fs.writeFileSync(outPath, `${JSON.stringify(portfolio, null, 2)}\n`);
console.log("Wrote", outPath);
