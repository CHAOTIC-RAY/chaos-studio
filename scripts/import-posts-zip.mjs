/**
 * Import Posts.zip: group Instagram carousels by shared post timestamp, preserve client folder order.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = path.resolve(root, process.argv[2] || "Posts.zip");
const postsJsonPath = path.join(root, "content", "campaign-posts.json");
const imagesRoot = path.join(root, "frontend", "public", "images", "posts");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"]);
const ACCENTS = ["purple", "pink", "gold", "teal"];

/** Folder order as packaged in Posts.zip */
const CLIENT_FOLDER_ORDER = [
  "Ayha",
  "Aysh Saloon",
  "Choparts",
  "Digital Dive",
  "ExpressShipping",
  "Fottcalm",
  "Haus of paws",
  "Lumeria",
  "metroflex & islanders nutrition",
  "Rainbow",
  "Rioga",
  "World Trip Tours",
];

const CLIENT_META = {
  ayha: { client: "Ayha Maldives", platform: "Instagram", accent: "teal" },
  "aysh-saloon": { client: "Aysh Salon", platform: "Instagram", accent: "pink" },
  choparts: { client: "Choparts Maldives", platform: "Instagram", accent: "purple" },
  "digital-dive": { client: "Digital Dive", platform: "Facebook", accent: "purple" },
  expressshipping: { client: "Express Shipping MV", platform: "Instagram", accent: "teal" },
  fottcalm: { client: "Footcalm", platform: "Instagram", accent: "pink" },
  "haus-of-paws": { client: "Haus of Paws", platform: "Instagram", accent: "gold" },
  lumeria: { client: "Lumeria Salon", platform: "Instagram", accent: "pink" },
  "metroflex-islanders-nutrition": {
    client: "Metroflex & Islanders Nutrition",
    platform: "Instagram",
    accent: "gold",
  },
  rainbow: { client: "Rainbow Enterprise", platform: "Instagram", accent: "purple" },
  rioga: { client: "Rioga Travel & Tours", platform: "Instagram", accent: "teal" },
  "world-trip-tours": { client: "World Trip Tours", platform: "Instagram", accent: "teal" },
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clientSlugFromFolder(folderName) {
  if (folderName === "metroflex & islanders nutrition") return "metroflex-islanders-nutrition";
  return slugify(folderName);
}

/** Multi-upload panoramas: separate timestamps that belong to one carousel */
const CAROUSEL_TIMESTAMP_MERGE = {
  expressshipping: [["1730799379", "1730799437", "1730799475"]],
};

/** Instagram export: account_UNIXTIME_mediaId_userId */
function postGroupKey(filename, clientSlug) {
  const base = path.basename(filename, path.extname(filename));
  const ig = base.match(/_(\d{10})_(\d+)_\d+$/);
  if (!ig) return base;
  const ts = ig[1];
  const merges = CAROUSEL_TIMESTAMP_MERGE[clientSlug];
  if (merges) {
    for (const group of merges) {
      if (group.includes(ts)) return `carousel-${group[0]}`;
    }
  }
  return ts;
}

function slideSortKey(filename) {
  const base = path.basename(filename, path.extname(filename));
  const ig = base.match(/_(\d{10})_(\d+)_\d+$/);
  if (ig) return ig[2];
  return base;
}

async function toWebp(src, dest) {
  await sharp(src).rotate().webp({ quality: 88 }).toFile(dest);
}

function findPostsRoot(extractedDir) {
  const direct = path.join(extractedDir, "Posts");
  if (fs.existsSync(direct)) return direct;
  for (const ent of fs.readdirSync(extractedDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const nested = path.join(extractedDir, ent.name, "Posts");
    if (fs.existsSync(nested)) return nested;
  }
  return extractedDir;
}

function folderOrderIndex(name) {
  const i = CLIENT_FOLDER_ORDER.indexOf(name);
  return i >= 0 ? i : CLIENT_FOLDER_ORDER.length + name.charCodeAt(0);
}

async function main() {
  if (!fs.existsSync(zipPath)) {
    console.error(`Missing zip: ${zipPath}`);
    process.exit(1);
  }

  const tmp = fs.mkdtempSync(path.join(root, ".tmp-posts-import-"));
  try {
    execSync(`unzip -oq ${JSON.stringify(zipPath)} -d ${JSON.stringify(tmp)}`, { stdio: "inherit" });
    const postsRoot = findPostsRoot(tmp);

    const clientDirs = fs
      .readdirSync(postsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => folderOrderIndex(a) - folderOrderIndex(b));

    const importedPosts = [];
    let accentIdx = 0;

    for (const folder of clientDirs) {
      const clientSlug = clientSlugFromFolder(folder);
      const meta = CLIENT_META[clientSlug] ?? {
        client: folder,
        platform: "Instagram",
        accent: ACCENTS[accentIdx % ACCENTS.length],
      };
      const dir = path.join(postsRoot, folder);
      const images = fs
        .readdirSync(dir)
        .filter((f) => IMAGE_EXT.has(path.extname(f)))
        .sort((a, b) => slideSortKey(a).localeCompare(slideSortKey(b), undefined, { numeric: true }));

      const byPost = new Map();
      for (const file of images) {
        const key = postGroupKey(file);
        if (!byPost.has(key)) byPost.set(key, []);
        byPost.get(key).push(file);
      }

      const postKeys = [...byPost.keys()].sort((a, b) => {
        const na = /^\d{10}$/.test(a) ? Number(a) : 0;
        const nb = /^\d{10}$/.test(b) ? Number(b) : 0;
        if (na && nb) return na - nb;
        return String(a).localeCompare(String(b), undefined, { numeric: true });
      });

      let postNum = 0;
      for (const postKey of postKeys) {
        postNum += 1;
        const postFiles = byPost
          .get(postKey)
          .sort((a, b) => slideSortKey(a).localeCompare(slideSortKey(b), undefined, { numeric: true }));
        const postId = `${clientSlug}-${String(postNum).padStart(2, "0")}`;
        const slideNames = postFiles.map((_, i) => `slide-${String(i + 1).padStart(2, "0")}`);
        const outDir = path.join(imagesRoot, postId);
        fs.mkdirSync(outDir, { recursive: true });

        await Promise.all(
          postFiles.map(async (file, idx) => {
            await toWebp(path.join(dir, file), path.join(outDir, `${slideNames[idx]}.webp`));
          }),
        );

        const isCarousel = slideNames.length > 1;
        const accent = meta.accent ?? ACCENTS[accentIdx % ACCENTS.length];
        const title = isCarousel
          ? `${meta.client} — carousel (${slideNames.length} slides)`
          : `${meta.client} — feed post`;

        const entry = {
          id: postId,
          platform: meta.platform,
          client: meta.client,
          title,
          description: isCarousel
            ? `Multi-slide ${meta.platform} carousel with on-brand layout, typography, and promo visuals.`
            : `Single-frame ${meta.platform} creative for ${meta.client}.`,
          tags: isCarousel ? ["Carousel", meta.platform] : [meta.platform],
          accent,
        };

        if (isCarousel) {
          entry.slides = slideNames;
        } else {
          fs.copyFileSync(path.join(outDir, `${slideNames[0]}.webp`), path.join(imagesRoot, `${postId}.webp`));
        }

        importedPosts.push(entry);
        console.log(`${postId}: ${slideNames.length} slide(s)${isCarousel ? " [carousel]" : ""}`);
      }
      accentIdx += 1;
    }

    const template = {
      id: "_copy-me-for-new-post",
      enabled: false,
      platform: "Instagram",
      client: "Client name here",
      title: "Your campaign title",
      description: "Write 1–3 sentences about what you designed and the goal of the post.",
      tags: ["Tag one", "Tag two"],
      accent: "purple",
    };

    const data = {
      subtitle: "Campaign & feed highlights",
      posts: [...importedPosts, template],
    };
    fs.writeFileSync(postsJsonPath, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`\nImported ${importedPosts.length} posts into ${postsJsonPath}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
