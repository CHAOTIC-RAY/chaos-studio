/**
 * Shared Decap CMS hooks (login shell + editor iframe).
 */
(function () {
  function normalizeListValue(val, prop) {
    if (!Array.isArray(val)) return val;
    return val.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && prop in item) return String(item[prop]);
      return String(item ?? "");
    });
  }

  function normalizeEntry(entry) {
    if (!entry?.data) return entry;
    const d = entry.data;
    if (Array.isArray(d.posts)) {
      for (const p of d.posts) {
        if (p.tags) p.tags = normalizeListValue(p.tags, "tag");
        if (p.slides) p.slides = normalizeListValue(p.slides, "slide");
      }
    }
    if (d.softSkills) d.softSkills = normalizeListValue(d.softSkills, "skill");
    if (d.experience?.items) {
      for (const job of d.experience.items) {
        if (job.bullets) job.bullets = normalizeListValue(job.bullets, "bullet");
      }
    }
    if (d.featuredWork?.projects) {
      for (const proj of d.featuredWork.projects) {
        if (proj.highlights) proj.highlights = normalizeListValue(proj.highlights, "line");
        if (proj.tags) proj.tags = normalizeListValue(proj.tags, "tag");
      }
    }
    if (d.skills?.categories) {
      for (const cat of d.skills.categories) {
        if (cat.tools) cat.tools = normalizeListValue(cat.tools, "tool");
      }
    }
    if (d.highlights) d.highlights = normalizeListValue(d.highlights, "line");
    if (d.services) d.services = normalizeListValue(d.services, "service");
    if (d.packages) {
      for (const pkg of d.packages) {
        if (pkg.features) pkg.features = normalizeListValue(pkg.features, "feature");
      }
    }
    if (d.about?.skills) d.about.skills = normalizeListValue(d.about.skills, "skill");
    return entry;
  }

  let lastUpdate = 0;
  async function sendLiveUpdate(entry) {
    if (Date.now() - lastUpdate < 150) return;
    lastUpdate = Date.now();

    const data = entry.get("data")?.toJS();
    if (!data) return;

    // Fetch full portfolio to merge changes (simulated for preview)
    try {
      const res = await fetch("https://portfolio.chaoticstudio.workers.dev/api/portfolio");
      const portfolio = await res.json();

      // Merge current entry into portfolio
      const slug = entry.get("slug");
      const collection = entry.get("collection");

      if (collection === "portfolio" && slug === "main") {
        Object.assign(portfolio, data);
      } else if (collection === "campaign" && slug === "social-posts") {
        portfolio.socialPosts = data;
      } else if (collection === "campaign" && slug === "gallery-posts") {
        portfolio.galleryPosts = data;
      } else if (collection === "chaos-studio" && slug === "studio-page") {
        portfolio.chaosStudio = data;
      }

      // Find preview frame in parent
      const frame = window.parent.document.getElementById("cms-preview-frame");
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: "cms-update", portfolio }, "*");
      }
    } catch (e) {
      console.warn("[CMS] Live update failed", e);
    }
  }

  function registerCmsHooks() {
    if (window.__chaosAppHooks || !window.CMS?.registerEventListener) return false;
    window.__chaosAppHooks = true;
    try {
      // Live Preview Bridge
      const Preview = ({ entry }) => {
        sendLiveUpdate(entry);
        return null;
      };
      window.CMS.registerPreviewTemplate("campaign", Preview);
      window.CMS.registerPreviewTemplate("portfolio", Preview);
      window.CMS.registerPreviewTemplate("chaos-studio", Preview);

      window.CMS.registerEventListener({
        name: "preSave",
        handler: ({ entry }) => {
          if (!entry?.get) return entry;
          const data = entry.get("data");
          if (!data?.toJS) return entry;
          const plain = data.toJS();
          normalizeEntry({ data: plain });
          const Map = data.constructor;
          if (Map?.fromJS) return entry.set("data", Map.fromJS(plain));
          return entry;
        },
      });
    } catch (e) {
      console.warn("[CMS] preSave hook skipped", e);
    }


    return true;
  }

  function boot() {
    if (registerCmsHooks()) return;
    let attempts = 0;
    const poll = setInterval(() => {
      attempts += 1;
      if (registerCmsHooks() || attempts >= 50) clearInterval(poll);
    }, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("load", boot);
})();
