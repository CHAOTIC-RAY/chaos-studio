/**
 * Import MDP campaign zip: post, poster, and media kit PDF → WebP slides.
 *
 * Usage:
 *   curl -sL "https://drive.google.com/uc?export=download&id=1-2PWDMXa0MkHTqSUeXohKxemhnyKN4j3" -o MDP.zip
 *   npm run import:mdp
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = path.resolve(root, process.argv[2] || "MDP.zip");
const extractDir = path.join(root, "MDP_extract");
const postsRoot = path.join(root, "frontend", "public", "images", "posts");
const postsJsonPath = path.join(root, "content", "campaign-posts.json");

const CAMPAIGN_DIR = "NEw/MDP Campaign Mohamed Amir";
const PDF_REL = "NEw/Media Kit Concep for Khulaasa/media kitc.pdf";
const MEDIA_KIT_ID = "mdp-media-kit";

function ensureExtracted() {
  if (!fs.existsSync(zipPath)) {
    console.error(`Missing ${zipPath}. Download MDP.zip from Drive first.`);
    process.exit(1);
  }
  const pdfPath = path.join(extractDir, PDF_REL);
  if (!fs.existsSync(pdfPath)) {
    fs.mkdirSync(extractDir, { recursive: true });
    execSync(`unzip -q -o "${zipPath}" -d "${extractDir}"`, { stdio: "inherit" });
  }
}

async function toWebp(src, dest, maxWidth = 2400) {
  await sharp(src)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(dest);
  console.log("  →", path.relative(root, dest));
}

function convertPdfToPngPages(pdfPath, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const pyScript = path.join(root, "scripts", "pdf-to-png-pages.py");
  const zoom = 2.5;
  const count = execSync(
    `python3 "${pyScript}" "${pdfPath}" "${outDir}" ${zoom}`,
    { encoding: "utf8" },
  ).trim();
  return Number(count);
}

function upsertPosts(slideCount) {
  const data = JSON.parse(fs.readFileSync(postsJsonPath, "utf8"));
  const slides = Array.from({ length: slideCount }, (_, i) => `slide-${String(i + 1).padStart(2, "0")}`);
  const newPosts = [
    {
      id: "mdp-post",
      platform: "Instagram",
      client: "MDP Campaign",
      title: "Campaign feed post",
      description:
        "Square social frame for the MDP campaign — bold typography and brand-forward layout built for feed engagement.",
      tags: ["Campaign", "Social", "MDP"],
      accent: "purple",
    },
    {
      id: "mdp-poster",
      cardLayout: "poster",
      mediaAspect: "portrait",
      platform: "Print / OOH",
      client: "MDP Campaign",
      title: "Campaign poster",
      description:
        "Portrait poster artwork for MDP — high-impact visuals sized for print and vertical placements.",
      tags: ["Poster", "Print", "MDP"],
      accent: "purple",
    },
    {
      id: "mdp-media-kit",
      cardLayout: "media-kit",
      mediaAspect: "landscape",
      platform: "Media kit",
      client: "MDP Campaign · Khulaasa",
      title: "Khulaasa media kit",
      description:
        "Full media kit for Khulaasa: nine landscape pages with brand specs, applications, and campaign guidance — swipe through like a connected deck.",
      tags: ["Media kit", "Branding", "Carousel", "Khulaasa"],
      accent: "teal",
      slides,
    },
  ];

  const without = data.posts.filter((p) => !p.id.startsWith("mdp-"));
  const templateIdx = without.findIndex((p) => p.id === "_copy-me-for-new-post");
  if (templateIdx === -1) {
    data.posts = [...without, ...newPosts];
  } else {
    data.posts = [...without.slice(0, templateIdx), ...newPosts, ...without.slice(templateIdx)];
  }

  fs.writeFileSync(postsJsonPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${postsJsonPath} (+3 MDP posts, ${slideCount} kit slides)`);
}

async function main() {
  ensureExtracted();

  const campaignDir = path.join(extractDir, CAMPAIGN_DIR);
  const postJpg = path.join(campaignDir, "photo_2026-05-23_04-48-51.jpg");
  const posterJpg = path.join(campaignDir, "photo_2026-05-23_04-48-55.jpg");
  const pdfPath = path.join(extractDir, PDF_REL);

  if (!fs.existsSync(postJpg) || !fs.existsSync(posterJpg)) {
    console.error("Expected two photos in MDP Campaign folder.");
    process.exit(1);
  }

  fs.mkdirSync(postsRoot, { recursive: true });

  console.log("Post & poster:");
  await toWebp(postJpg, path.join(postsRoot, "mdp-post.webp"), 1400);
  await toWebp(posterJpg, path.join(postsRoot, "mdp-poster.webp"), 1400);

  const kitDir = path.join(postsRoot, MEDIA_KIT_ID);
  const tmpDir = path.join(root, ".tmp-mdp-pdf");
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log("\nMedia kit PDF → PNG:");
  const pageCount = convertPdfToPngPages(pdfPath, tmpDir);
  console.log(`  ${pageCount} pages`);

  fs.rmSync(kitDir, { recursive: true, force: true });
  fs.mkdirSync(kitDir, { recursive: true });

  console.log("\nMedia kit → WebP:");
  const pngs = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".png")).sort();
  for (const png of pngs) {
    const base = path.basename(png, ".png");
    await toWebp(path.join(tmpDir, png), path.join(kitDir, `${base}.webp`), 2200);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  upsertPosts(pageCount);

  execSync("npm run sync:content", { cwd: root, stdio: "inherit" });
  console.log("\nDone. Run npm run build to deploy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
