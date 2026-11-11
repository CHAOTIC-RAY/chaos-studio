(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PLACEHOLDER = "/assets/work/_placeholders/default-cover.svg";
  const mobile = () => matchMedia("(max-width: 520px)").matches;

  const grid = $("#showcase-grid");
  const headline = $("#showcase-headline");
  if (!grid) return;

  grid.classList.add("featured-bento");

  function screenImg(src, alt, eager) {
    return `<img class="device__media" src="${esc(src)}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async" width="${mobile() ? 390 : 800}" height="${mobile() ? 844 : 500}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`;
  }

  function browserFrame(src, alt, url) {
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

  function devicesHtml(item, title) {
    const alt = `${title} preview`;
    const layout = item.layout || "solo";
    const url = item.url || item.slug || title;
    if (layout === "dual" && item.desktop && item.mobile) {
      return `<div class="feat-devices feat-devices--dual feat-devices--${layout}">
        <div class="feat-devices__composition">
          ${browserFrame(item.desktop, `${alt} desktop`, url)}
          ${phoneFrame(item.mobile, `${alt} mobile`)}
        </div>
      </div>`;
    }
    if (layout === "phone-hero" && item.mobile) {
      const desk = item.desktop ? browserFrame(item.desktop, `${alt} desktop`, url) : "";
      return `<div class="feat-devices feat-devices--dual feat-devices--phone-hero">
        <div class="feat-devices__composition">
          ${desk}
          ${phoneFrame(item.mobile, `${alt} mobile`)}
        </div>
      </div>`;
    }
    return `<div class="feat-devices feat-devices--solo">${browserFrame(item.desktop || item.mobile || PLACEHOLDER, alt, url)}</div>`;
  }

  function tile(item, i) {
    const title = item.title || item.slug;
    const href = item.href || "#";
    const tag = item.tagline || item.category || "";
    const num = String(i + 1).padStart(2, "0");
    return `<li class="feat ${item.mod || ""}" data-reveal style="--d:${i * 55}ms">
      <a class="feat-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer">
        ${devicesHtml(item, title)}
        <span class="feat-meta">
          <span class="feat-meta__top">
            <span class="dot-num dot-num--sm dot-num--lime feat-num" data-dots="${num}" data-dot-variant="lime"></span>
            <span class="feat-cat">${esc(item.category || "Product")}</span>
          </span>
          <span class="feat-title">${esc(title)}</span>
          <span class="feat-tag">${esc(tag)}</span>
        </span>
      </a>
    </li>`;
  }

  function renderFromCms(c) {
    const items = [...(c.featuredWork || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const html = items.map((item, i) => tile(item, i));
    grid.innerHTML = html.join("");
    if (headline && c.showcaseHeadline) headline.textContent = c.showcaseHeadline;
    grid.setAttribute("aria-busy", "false");
    window.ChaosDotNumerals && grid.querySelectorAll("[data-dots]").forEach((el) => window.ChaosDotNumerals.renderDots(el));

    if (reduced()) {
      grid.querySelectorAll(".feat").forEach((el) => el.classList.add("in"));
      document.dispatchEvent(new CustomEvent("cs-showcase-ready"));
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
    grid.querySelectorAll(".feat").forEach((el) => io.observe(el));
    document.dispatchEvent(new CustomEvent("cs-showcase-ready"));
  }

  function renderLegacy() {
    fetch("/assets/site.config.json")
      .then((r) => r.json())
      .then((cfg) => {
        const FEATURED = [
          { slug: "kora", mod: "feat--kora" },
          { slug: "faisa", title: "FaisaMobileXYZ", mod: "feat--faisa" },
          { slug: "forge", mod: "feat--forge" },
          { slug: "GexTag", title: "UtilityBox", mod: "feat--utility" },
          { slug: "QuePulse", mod: "feat--quepulse" },
        ];
        const bySlug = Object.fromEntries((cfg.work || []).map((w) => [w.slug.toLowerCase(), w]));
        const html = [];
        FEATURED.forEach((item, i) => {
          const key = item.slug.toLowerCase();
          const project = bySlug[key];
          if (!project) return;
          const merged = { ...project, ...item, title: item.title || project.title };
          html.push(tile(merged, i));
        });
        grid.innerHTML = html.join("");
        grid.setAttribute("aria-busy", "false");
        document.dispatchEvent(new CustomEvent("cs-showcase-ready"));
      })
      .catch(() => {
        grid.innerHTML = "";
        grid.setAttribute("aria-busy", "false");
      });
  }

  document.addEventListener(
    "cms-content-ready",
    (e) => {
      renderFromCms(e.detail || window.__SITE_CONTENT__ || {});
    },
    { once: true },
  );

  if (window.__SITE_CONTENT__) {
    renderFromCms(window.__SITE_CONTENT__);
  } else {
    setTimeout(() => {
      if (!grid.getAttribute("aria-busy") || grid.getAttribute("aria-busy") === "true") {
        if (!window.__SITE_CONTENT__) renderLegacy();
      }
    }, 2500);
  }
})();
