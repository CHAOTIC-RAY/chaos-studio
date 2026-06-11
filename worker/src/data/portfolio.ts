import portfolioBase from "../../../content/portfolio.json";
import chaosStudioRaw from "../../../content/chaos-studio.json";
import galleryRaw from "../../../content/gallery.json";
import { getSocialPosts } from "./campaign-posts";
import { toStringList } from "./cms-list-shape";

function normalizePortfolioBase<T extends typeof portfolioBase>(base: T): T {
  return {
    ...base,
    softSkills: toStringList(base.softSkills, "skill"),
    experience: {
      ...base.experience,
      items: base.experience.items.map((job) => ({
        ...job,
        bullets: job.bullets ? toStringList(job.bullets, "bullet") : undefined,
      })),
    },
    featuredWork: {
      ...base.featuredWork,
      projects: base.featuredWork.projects.map((proj) => ({
        ...proj,
        highlights: proj.highlights ? toStringList(proj.highlights, "line") : undefined,
        tags: proj.tags ? toStringList(proj.tags, "tag") : undefined,
      })),
    },
    skills: {
      ...base.skills,
      categories: base.skills.categories.map((cat) => ({
        ...cat,
        tools: toStringList(cat.tools, "tool"),
      })),
    },
  } as T;
}

function normalizeChaosStudio<T extends typeof chaosStudioRaw>(studio: T): T {
  return {
    ...studio,
    highlights: toStringList(studio.highlights, "line"),
    services: toStringList(studio.services, "service"),
    packages: studio.packages.map((pkg) => ({
      ...pkg,
      features: toStringList(pkg.features, "feature"),
    })),
  } as T;
}

function normalizeGallery<T extends typeof galleryRaw>(gallery: T): T {
  return {
    ...gallery,
  } as T;
}

export const portfolio = {
  ...normalizePortfolioBase(portfolioBase),
  chaosStudio: normalizeChaosStudio(chaosStudioRaw),
  gallery: normalizeGallery(galleryRaw),
  socialPosts: getSocialPosts(),
};

export type Portfolio = typeof portfolio;
