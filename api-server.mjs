import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readJson(file) {
  return JSON.parse(readFileSync(join(__dirname, "content", file), "utf-8"));
}

function toStringList(arr, prop) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && prop in item) {
        return String(item[prop] ?? "");
      }
      return "";
    })
    .filter(Boolean);
}

function visiblePosts(posts) {
  return posts
    .filter((p) => p.enabled !== false && !p.id.startsWith("_"))
    .map(({ enabled: _e, ...post }) => {
      const p = { ...post };
      p.tags = toStringList(p.tags, "tag");
      if (p.slides) p.slides = toStringList(p.slides, "slide");
      if (p.cardLayout === "default") delete p.cardLayout;
      if (p.mediaAspect === "default") delete p.mediaAspect;
      return p;
    });
}

function buildPortfolio() {
  const portfolioBase = readJson("portfolio.json");
  const chaosStudioRaw = readJson("chaos-studio.json");
  const galleryRaw = readJson("gallery.json");
  const socialRaw = readJson("social-posts.json");
  const galleryPostsRaw = readJson("gallery-posts.json");
  const meta = readJson("campaign-meta.json");

  const base = {
    ...portfolioBase,
    softSkills: toStringList(portfolioBase.softSkills, "skill"),
    experience: {
      ...portfolioBase.experience,
      items: portfolioBase.experience.items.map((job) => ({
        ...job,
        bullets: job.bullets ? toStringList(job.bullets, "bullet") : undefined,
      })),
    },
    featuredWork: {
      ...portfolioBase.featuredWork,
      projects: portfolioBase.featuredWork.projects.map((proj) => ({
        ...proj,
        highlights: proj.highlights ? toStringList(proj.highlights, "line") : undefined,
        tags: proj.tags ? toStringList(proj.tags, "tag") : undefined,
      })),
    },
    skills: {
      ...portfolioBase.skills,
      categories: portfolioBase.skills.categories.map((cat) => ({
        ...cat,
        tools: toStringList(cat.tools, "tool"),
      })),
    },
  };

  const chaosStudio = {
    ...chaosStudioRaw,
    highlights: toStringList(chaosStudioRaw.highlights, "line"),
    services: toStringList(chaosStudioRaw.services, "service"),
    packages: chaosStudioRaw.packages.map((pkg) => ({
      ...pkg,
      features: toStringList(pkg.features, "feature"),
    })),
  };

  const socialPosts = {
    subtitle: meta.subtitle,
    items: visiblePosts(socialRaw.posts),
  };

  const galleryPosts = {
    items: visiblePosts(galleryPostsRaw.posts),
  };

  return {
    ...base,
    chaosStudio,
    gallery: galleryRaw,
    socialPosts,
    galleryPosts,
  };
}

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300",
  "Access-Control-Allow-Origin": "*",
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`);

  if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    res.writeHead(204, {
      ...JSON_HEADERS,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  if (url.pathname === "/api/portfolio" && req.method === "GET") {
    try {
      const portfolio = buildPortfolio();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify(portfolio));
    } catch (err) {
      console.error("Error building portfolio:", err);
      res.writeHead(500, JSON_HEADERS);
      res.end(JSON.stringify({ error: "Failed to build portfolio" }));
    }
    return;
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, service: "portfolio" }));
    return;
  }

  if (url.pathname === "/api/contact" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { name, email, message } = JSON.parse(body);
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
          res.writeHead(400, JSON_HEADERS);
          res.end(JSON.stringify({ error: "name, email, and message are required" }));
          return;
        }
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, message: "Thanks for reaching out. Your message was received." }));
      } catch {
        res.writeHead(400, JSON_HEADERS);
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
      }
    });
    return;
  }

  res.writeHead(404, JSON_HEADERS);
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = 3001;
server.listen(PORT, "localhost", () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
