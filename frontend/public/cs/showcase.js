(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PLACEHOLDER = "/assets/work/_placeholders/default-cover.svg";
  const mobile = () => matchMedia("(max-width: 520px)").matches;

  const MEDIA = {
    kora: {
      layout: "dual",
      desktop: "/assets/work/kora/cover.png",
      mobile: "/assets/work/kora/cover.png",
      url: "kora.chaoticstudio.workers.dev",
    },
    faisa: {
      layout: "phone-hero",
      mobile: "/images/projects/frames/faisa/02-home.webp",
      desktop: "/images/projects/frames/faisa/06-transfer.webp",
      url: "FaisaMobileXYZ prototype",
    },
    forge: {
      layout: "dual",
      desktop: "/images/projects/frames/forge/desktop/02-dashboard.webp",
      mobile: "/images/projects/frames/forge/mobile/02-dashboard.webp",
      url: "forge.chaoticstudio.workers.dev",
    },
    gextag: {
      layout: "solo",
      desktop: "/assets/work/gextag/cover.webp",
      url: "gextag.chaoticstudio.workers.dev",
    },
    quepulse: {
      layout: "dual",
      desktop: "/assets/work/quepulse/cover.webp",
      mobile: "/assets/work/quepulse/cover.webp",
      url: "quepulse.chaoticstudio.workers.dev",
    },
  };

  const FEATURED = [
    { slug: "kora", mod: "feat--kora" },
    { slug: "faisa", title: "FaisaMobileXYZ", mod: "feat--faisa" },
    { slug: "forge", mod: "feat--forge" },
    { slug: "GexTag", title: "UtilityBox", mod: "feat--utility" },
    { slug: "QuePulse", mod: "feat--quepulse" },
  ];

  function host(href) {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return href || "";
    }
  }

  function screenImg(src, alt, eager) {
    return `<img class="device__media" src="${esc(src)}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async" width="${mobile() ? 390 : 800}" height="${mobile() ? 844 : 500}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`;
  }

  function browserFrame(src, alt, url, href) {
    return `<div class="device device--browser" aria-hidden="true">
      <div class="device__chrome">
        <span class="device__dots"><i></i><i></i><i></i></span>
        <span class="device__chrome-brand"><span class="device__url">${esc(url)}</span></span>
      </div>
      <div class="device__screen">${screenImg(src, alt, false)}</div>
    </div>`;
  }

  function phoneFrame(src, alt) {
    return `<div class="device device--phone" aria-hidden="true">
      <div class="device__bezel">
        <span class="device__notch"></span>
        <div class="device__screen">${screenImg(src, alt, false)}</div>
      </div>
    </div>`;
  }

  function devicesHtml(slug, title) {
    const m = MEDIA[slug] || MEDIA[slug.toLowerCase()];
    const alt = `${title} preview`;
    if (!m) {
      return `<div class="feat-devices feat-devices--solo">${browserFrame(PLACEHOLDER, alt, "", "#")}</div>`;
    }
    const url = m.url || slug;
    const layout = m.layout || "solo";
    if (layout === "dual" && m.desktop && m.mobile) {
      return `<div class="feat-devices feat-devices--dual feat-devices--${layout}">
        <div class="feat-devices__composition">
          ${browserFrame(m.desktop, `${alt} desktop`, url, "#")}
          ${phoneFrame(m.mobile, `${alt} mobile`)}
        </div>
      </div>`;
    }
    if (layout === "phone-hero" && m.mobile) {
      const desk = m.desktop ? browserFrame(m.desktop, `${alt} desktop`, url, "#") : "";
      return `<div class="feat-devices feat-devices--dual feat-devices--phone-hero">
        <div class="feat-devices__composition">
          ${desk}
          ${phoneFrame(m.mobile, `${alt} mobile`)}
        </div>
      </div>`;
    }
  return `<div class="feat-devices feat-devices--solo">${browserFrame(m.desktop || m.mobile || PLACEHOLDER, alt, url, "#")}</div>`;
  }

  const grid = $("#showcase-grid");
  const headline = $("#showcase-headline");
  if (!grid) return;

  grid.classList.add("featured-bento");

  function tile(item, project, i) {
    const title = item.title || project.title;
    const href = project.href || "#";
    const tag = item.tagline || project.tagline || project.category || "";
    const num = String(i + 1).padStart(2, "0");
    const slugKey = item.slug.toLowerCase();
    return `<li class="feat ${item.mod || ""}" data-reveal style="--d:${i * 55}ms">
      <a class="feat-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer">
        ${devicesHtml(slugKey, title)}
        <span class="feat-meta">
          <span class="feat-meta__top">
            <span class="dot-num dot-num--sm dot-num--lime feat-num" data-dots="${num}" data-dot-variant="lime"></span>
            <span class="feat-cat">${esc(project.category || "Product")}</span>
          </span>
          <span class="feat-title">${esc(title)}</span>
          <span class="feat-tag">${esc(tag)}</span>
        </span>
      </a>
    </li>`;
  }

  fetch("/assets/site.config.json")
    .then((r) => r.json())
    .then((cfg) => {
      const bySlug = Object.fromEntries((cfg.work || []).map((w) => [w.slug.toLowerCase(), w]));
      const html = [];
      const used = [];
      FEATURED.forEach((item, i) => {
        const key = item.slug.toLowerCase();
        const project = bySlug[key];
        if (!project) return;
        const media = MEDIA[item.slug] || MEDIA[key];
        used.push({
          slug: item.slug,
          real: !!(media && (media.desktop || media.mobile)),
        });
        html.push(tile(item, project, i));
      });
      grid.innerHTML = html.join("");
      if (headline) headline.textContent = "Five featured builds — product shots in device frames.";
      grid.setAttribute("aria-busy", "false");
      window.ChaosDotNumerals && grid.querySelectorAll("[data-dots]").forEach((el) => window.ChaosDotNumerals.renderDots(el));

      if (reduced()) {
        grid.querySelectorAll(".feat").forEach((c) => c.classList.add("in"));
        return;
      }
      const io = new IntersectionObserver(
        (es) => {
          es.forEach((x) => {
            if (x.isIntersecting) {
              x.target.classList.add("in");
              io.unobserve(x.target);
            }
          });
        },
        { threshold: 0.06, rootMargin: "0px 0px -6% 0px" },
      );
      grid.querySelectorAll(".feat").forEach((c) => io.observe(c));
      grid.dataset.featuredMeta = JSON.stringify(used);
      document.dispatchEvent(new CustomEvent("cs-showcase-ready"));
    })
    .catch(() => {
      grid.innerHTML = "";
      grid.setAttribute("aria-busy", "false");
    });
})();
