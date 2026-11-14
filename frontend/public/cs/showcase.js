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

  function resolveLayout(item) {
    if (item.deviceLayout) return item.deviceLayout;
    if (item.layout === "phone-hero") return "phone-only";
    if (item.layout === "dual") return "dual";
    if (item.layout === "solo") return "browser";
    return item.layout || "browser";
  }

  function shot(item, slot) {
    const s = item.screenshots || {};
    if (s[slot]) return s[slot];
    if (slot === "laptop" || slot === "browser" || slot === "tablet") return item.desktop;
    return item.mobile;
  }

  function screenImg(src, alt, eager) {
    return `<img class="device__media" src="${esc(src || PLACEHOLDER)}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async" width="${mobile() ? 390 : 800}" height="${mobile() ? 844 : 500}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">`;
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

  function laptopFrame(src, alt, url) {
    return `<div class="device device--browser device--laptop" aria-hidden="true">
      <div class="device__chrome">
        <span class="device__dots"><i></i><i></i><i></i></span>
        <span class="device__chrome-brand"><span class="device__url">${esc(url)}</span></span>
      </div>
      <div class="device__screen device__screen--laptop">${screenImg(src, alt, false)}</div>
    </div>`;
  }

  function tabletFrame(src, alt) {
    return `<div class="device device--tablet" aria-hidden="true">
      <div class="device__bezel device__bezel--tablet">
        <div class="device__screen">${screenImg(src, alt, false)}</div>
      </div>
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
    const layout = resolveLayout(item);
    const url = item.url || item.slug || title;
    const phone = shot(item, "phone");
    const phone2 = shot(item, "phone2");
    const laptop = shot(item, "laptop") || shot(item, "browser");
    const browser = shot(item, "browser") || shot(item, "laptop");

    if (layout === "phone-only") {
      return `<div class="feat-devices feat-devices--phone-only">
        <div class="feat-devices__composition">${phoneFrame(phone, alt)}</div>
      </div>`;
    }
    if (layout === "dual-phone") {
      return `<div class="feat-devices feat-devices--dual-phone">
        <div class="feat-devices__composition">
          ${phoneFrame(phone, `${alt} A`)}
          ${phoneFrame(phone2 || phone, `${alt} B`)}
        </div>
      </div>`;
    }
    if (layout === "dual" || layout === "laptop") {
      const desk = layout === "laptop" ? laptopFrame(laptop, `${alt} laptop`, url) : browserFrame(browser, `${alt} desktop`, url);
      return `<div class="feat-devices feat-devices--dual feat-devices--${layout}">
        <div class="feat-devices__composition">
          ${desk}
          ${phone ? phoneFrame(phone, `${alt} mobile`) : ""}
        </div>
      </div>`;
    }
    if (layout === "phone") {
      return `<div class="feat-devices feat-devices--phone-only">${phoneFrame(phone, alt)}</div>`;
    }
    if (layout === "tablet") {
      return `<div class="feat-devices feat-devices--solo">${tabletFrame(shot(item, "tablet"), alt)}</div>`;
    }
  return `<div class="feat-devices feat-devices--solo">${browserFrame(browser || phone || PLACEHOLDER, alt, url)}</div>`;
  }

  function featIcon(item, i) {
    const url = item.appIconUrl;
    if (url) {
      return `<img class="feat-app-icon" src="${esc(url)}" alt="" width="48" height="48" loading="lazy" decoding="async">`;
    }
    const num = String(i + 1).padStart(2, "0");
    return `<span class="dot-num dot-num--sm dot-num--lime feat-num" data-dots="${num}" data-dot-variant="lime"></span>`;
  }

  function tile(item, i) {
    const title = item.title || item.slug;
    const href = item.href || "#";
    const tag = item.tagline || item.category || "";
    return `<li class="feat ${item.mod || ""} in" style="--d:${i * 55}ms">
      <a class="feat-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer">
        ${devicesHtml(item, title)}
        <span class="feat-meta">
          <span class="feat-meta__top">
            ${featIcon(item, i)}
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
    grid.innerHTML = items.map((item, i) => tile(item, i)).join("");
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
    fetch("/api/content")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((c) => c && renderFromCms(c));
  }

  window.ChaosShowcasePreview = { devicesHtml, resolveLayout, shot, esc };
})();
