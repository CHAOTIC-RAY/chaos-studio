#!/usr/bin/env node
/**
 * Decap CMS only lists media_folder at depth 1 (root files).
 * This manifest powers the "All post images" browser in /admin/.
 * Skips build-time pano thumbs (*.pano.webp) and preview.mp4.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const postsDir = path.join(root, "frontend/public/images/posts");
const outPath = process.env.CMS_MANIFEST_OUT
  ? path.resolve(process.env.CMS_MANIFEST_OUT)
  : path.join(root, "frontend/public/admin/media-manifest.json");

const MEDIA_RE = /\.(webp|jpe?g|png|gif|svg|mp4)$/i;
/** Build-time gallery assets — not CMS-editable media */
const SKIP_RE = /\.pano\.webp$/i;
const SKIP_NAMES = new Set(["preview.mp4"]);

function walk(dir, relBase = "") {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith("_") || name.name === "README.md") continue;

    const abs = path.join(dir, name.name);
    const rel = relBase ? `${relBase}/${name.name}` : name.name;

    if (name.isDirectory()) {
      files.push(...walk(abs, rel));
    } else if (MEDIA_RE.test(name.name) && !SKIP_RE.test(name.name) && !SKIP_NAMES.has(name.name)) {
      const folder = relBase || "";
      const slideMatch = name.name.match(/^(slide-\d+)/i);
      files.push({
        path: rel.replace(/\\/g, "/"),
        url: `/images/posts/${rel.replace(/\\/g, "/")}`,
        folder: folder || "(uploads)",
        name: name.name,
        slideBasename: slideMatch ? slideMatch[1] : null,
      });
    }
  }

  return files;
}

const files = walk(postsDir).sort((a, b) => a.path.localeCompare(b.path));
const folders = [...new Set(files.map((f) => f.folder))].sort();

const manifest = {
  generatedAt: new Date().toISOString(),
  note: "Includes subfolders; Decap Media tab only shows root-level uploads.",
  total: files.length,
  rootCount: files.filter((f) => !f.path.includes("/")).length,
  folderCount: folders.length,
  folders,
  files,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Wrote media manifest: ${files.length} files (${manifest.rootCount} in root, ${files.length - manifest.rootCount} in folders) → ${path.relative(root, outPath)}`,
);
