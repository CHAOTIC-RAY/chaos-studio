import { readFileSync } from "node:fs";
import { join } from "node:path";

function readJson(root, rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function toStringList(arr, prop) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && prop in item) return String(item[prop] ?? "");
      return "";
    })
    .filter(Boolean);
}

function normalizePost(post) {
  const p = { ...post, tags: toStringList(post.tags, "tag") };
  if (p.slides) p.slides = toStringList(p.slides, "slide");
  return p;
}

function visiblePosts(posts) {
  return posts
    .filter((p) => p.enabled !== false && !String(p.id).startsWith("_"))
    .map((p) => {
      const { enabled, ...rest } = p;
      return normalizePost(rest);
    });
}

export function buildGallerySnapshot(root) {
  const portfolioBase = readJson(root, "content/portfolio.json");
  const chaosStudio = readJson(root, "content/chaos-studio.json");
  const gallery = readJson(root, "content/gallery.json");
  const social = visiblePosts(readJson(root, "content/social-posts.json").posts);
  const galleryPosts = visiblePosts(readJson(root, "content/gallery-posts.json").posts);
  const meta = readJson(root, "content/campaign-meta.json");

  return {
    ...portfolioBase,
    softSkills: toStringList(portfolioBase.softSkills, "skill"),
    chaosStudio: {
      ...chaosStudio,
      highlights: toStringList(chaosStudio.highlights, "line"),
      services: toStringList(chaosStudio.services, "service"),
      packages: chaosStudio.packages.map((pkg) => ({
        ...pkg,
        features: toStringList(pkg.features, "feature"),
      })),
    },
    gallery,
    socialPosts: { subtitle: meta.subtitle, items: social },
    galleryPosts: { items: galleryPosts },
  };
}
