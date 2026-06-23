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

  function registerCmsHooks() {
    if (window.__chaosAppHooks || !window.CMS?.registerEventListener) return false;
    window.__chaosAppHooks = true;
    try {
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
