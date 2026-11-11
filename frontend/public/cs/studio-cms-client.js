(function () {
  const API = "/api/content";
  const FALLBACK = "/content/site-content.defaults.json";
  const G = () => window.ChaosContactGlyphs || {};

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function fetchContent() {
    try {
      const res = await fetch(API, { credentials: "same-origin" });
      if (res.ok) return res.json();
    } catch {
      /* use fallback */
    }
    const res = await fetch(FALLBACK);
    return res.json();
  }

  function renderHeaderContact(c) {
    const slot = document.getElementById("header-contact");
    if (!slot) return;
    const glyphs = G();
    slot.className = "contact-chrome contact-chrome--header";
    slot.innerHTML = `
      <a class="contact-btn contact-btn--wa" href="${esc(c.contact.whatsappUrl)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        ${glyphs.whatsapp || ""}<span class="contact-btn__text">WA</span>
      </a>
      <a class="contact-btn contact-btn--tg" href="${esc(c.contact.telegramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
        ${glyphs.telegram || ""}<span class="contact-btn__text">TG</span>
      </a>`;
  }

  function renderHeroContact(c) {
    const slot = document.getElementById("hero-contact");
    if (!slot) return;
    const glyphs = G();
    const primary = c.hero?.primaryCta?.label || "WhatsApp us";
    const secondary = c.hero?.secondaryCta?.label || "Telegram";
    slot.className = "ctas contact-chrome contact-chrome--hero";
    slot.innerHTML = `
      <a class="contact-cta contact-cta--primary" href="${esc(c.contact.whatsappUrl)}" target="_blank" rel="noopener noreferrer">
        ${glyphs.whatsapp || ""}<span>${esc(primary)}</span>
      </a>
      <a class="contact-cta contact-cta--ghost" href="${esc(c.contact.telegramUrl)}" target="_blank" rel="noopener noreferrer">
        ${glyphs.telegram || ""}<span>${esc(secondary)}</span>
      </a>`;
  }

  function renderMenuContact(c) {
    const slot = document.getElementById("menu-contact");
    if (!slot) return;
    const glyphs = G();
    slot.className = "contact-chrome contact-chrome--mobile-menu";
    slot.innerHTML = `
      <a class="contact-cta contact-cta--primary" href="${esc(c.contact.whatsappUrl)}" target="_blank" rel="noopener noreferrer">
        ${glyphs.whatsapp || ""}<span>${esc(c.hero?.primaryCta?.label || "WhatsApp us")}</span>
      </a>
      <a class="contact-cta contact-cta--ghost" href="${esc(c.contact.telegramUrl)}" target="_blank" rel="noopener noreferrer">
        ${glyphs.telegram || ""}<span>${esc(c.hero?.secondaryCta?.label || "Telegram")}</span>
      </a>`;
  }

  function hydrateMeta(c) {
    if (c.seo?.title) document.title = c.seo.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && c.seo?.description) desc.setAttribute("content", c.seo.description);
    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme && c.seo?.themeColor) theme.setAttribute("content", c.seo.themeColor);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && c.seo?.title) ogTitle.setAttribute("content", c.seo.title);
  }

  function hydrateHero(c) {
    const h1 = document.querySelector(".hero-h");
    if (h1 && c.hero) {
      const chaos = h1.querySelector(".glitch") || h1.querySelector('[data-text="chaos"]');
      const studio = h1.querySelector(".hero-studio");
      if (chaos) {
        chaos.textContent = c.hero.wordmarkLine1 || chaos.textContent;
        chaos.setAttribute("data-text", c.hero.wordmarkLine1 || chaos.getAttribute("data-text") || "");
      }
      if (studio) studio.textContent = c.hero.wordmarkLine2 || studio.textContent;
    }
    const headline = document.querySelector(".hero .headline");
    if (headline && c.hero?.headline) headline.innerHTML = c.hero.headline;
    const pitch = document.querySelector(".hero .pitch");
    if (pitch && c.hero?.pitch) pitch.textContent = c.hero.pitch;
    const scroll = document.querySelector(".hero-scroll-cue");
    if (scroll && c.hero?.scrollCue?.label) {
      scroll.textContent = c.hero.scrollCue.label;
      scroll.setAttribute("aria-label", `Scroll — ${c.hero.scrollCue.label}`);
    }
    renderHeroContact(c);
  }

  function hydrateAbout(c) {
    if (!c.about) return;
    const h = document.querySelector(".about-h");
    if (h && c.about.title) h.innerHTML = c.about.title;
    const copy = document.querySelector(".about-copy");
    if (copy && c.about.copy) copy.textContent = c.about.copy;
    const list = document.querySelector(".about-list");
    if (list && Array.isArray(c.about.bullets)) {
      const tilts = ["-2deg", "1.5deg", "-1deg", "2deg"];
      list.innerHTML = c.about.bullets
        .map((text, i) => `<li style="--tilt:${tilts[i % tilts.length]}">${esc(text)}</li>`)
        .join("");
    }
  }

  function hydrateServices(c) {
    const list = document.querySelector(".svc-list");
    if (!list || !Array.isArray(c.services)) return;
    list.innerHTML = c.services
      .map(
        (s, i) =>
          `<li><span class="mono">${String(i + 1).padStart(2, "0")}</span><span class="cond">${esc(s.title)}</span><a class="sticker from" href="#packages" tabindex="-1" aria-hidden="true">see packages ↓</a></li>`,
      )
      .join("");
    const strip = document.querySelector(".lime-strip .dot-type-strip");
    if (strip) {
      const chunk = c.services.map((s) => s.title.toUpperCase()).join(" ✶ ");
      strip.textContent = `${chunk} ✶ `.repeat(2);
    }
  }

  function hydrateWhy(c) {
    const bento = document.querySelector(".why-bento");
    if (!bento || !Array.isArray(c.whyUs)) return;
    bento.innerHTML = c.whyUs
      .map(
        (w) =>
          `<article class="why" data-why-card><span class="why-rule" aria-hidden="true"></span><span class="num why-dot-ico" data-why-icon="${esc(w.iconKey)}" aria-hidden="true"></span><h3>${esc(w.title)}</h3><p>${esc(w.body)}</p></article>`,
      )
      .join("");
    const brace = document.querySelector("[data-why-brace] .why-brace__inner");
    if (brace) {
      const tag = c.whyBrace || "{no middlemen}";
      brace.textContent = tag;
    }
  }

  function waLink(base, text) {
    try {
      const u = new URL(base);
      if (text) u.searchParams.set("text", text);
      return u.toString();
    } catch {
      return base;
    }
  }

  function hydratePackages(c) {
    const root = document.querySelector(".pks.pk-bento");
    const note = document.querySelector(".pk-note");
    if (note && c.pricingNote) note.textContent = c.pricingNote;
    if (!root || !Array.isArray(c.packages)) return;
    const sorted = [...c.packages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    root.innerHTML = sorted
      .map((p, idx) => {
        const rec = p.featured ? '<span class="tag fine pk-sticker">Recommended</span>' : `<span class="tag fine">Package ${String(idx + 1).padStart(2, "0")}</span>`;
        const dels = (p.deliverables || [])
          .map((d, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><span>${esc(d.text)}</span></li>`)
          .join("");
        const cls = p.featured ? "pk pk--rec" : "pk";
        return `<article class="${cls}" role="listitem" data-reveal data-pkg-id="${esc(p.id)}">
          ${rec}
          <h3>${esc(p.name)}</h3>
          <p class="tl">${esc(p.tagline)}</p>
          <p class="fine">${(p.deliverables || []).length} deliverables included</p>
          <ul>${dels}</ul>
          <div class="price"><span class="fine">Starting at</span><span class="amt">${esc(p.price)}<small>${esc(p.currency || "MVR")}</small></span></div>
          <a class="btn pill" href="${esc(waLink(c.contact.whatsappUrl, p.whatsappText || p.name))}" target="_blank" rel="noopener noreferrer">Enquire on WhatsApp</a>
        </article>`;
      })
      .join("");
  }

  function hydrateWork(c) {
    const hl = document.getElementById("showcase-headline");
    if (hl && c.showcaseHeadline) hl.textContent = c.showcaseHeadline;
    const cta = document.getElementById("showcase-portfolio-cta");
    if (cta && c.contact?.portfolioGalleryUrl) cta.href = c.contact.portfolioGalleryUrl;
    const long = cta?.querySelector(".cta-portfolio-long");
    const short = cta?.querySelector(".cta-portfolio-short");
    if (long && c.contact?.portfolioCtaLong) long.textContent = c.contact.portfolioCtaLong;
    if (short && c.contact?.portfolioCtaShort) short.textContent = c.contact.portfolioCtaShort;
  }

  function hydrateFinale(c) {
    const tag = document.querySelector(".studio-finale .fin-tag");
    if (tag && c.finale?.tag) tag.textContent = c.finale.tag;
    const head = document.getElementById("studio-finale-cta");
    if (head && c.finale?.headline) head.innerHTML = c.finale.headline;
    const main = document.querySelector(".studio-finale .btn.cta");
    if (main && c.contact) {
      main.href = c.contact.whatsappUrl;
      main.textContent = c.contact.finaleCta || c.hero?.primaryCta?.label || "WhatsApp us";
    }
    const links = document.querySelector(".studio-finale__links");
    if (links && Array.isArray(c.finale?.links)) {
      links.innerHTML = c.finale.links.map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`).join("");
    }
    const brace = document.querySelector(".studio-finale .brace");
    if (brace && c.finale?.brace) brace.textContent = c.finale.brace;
  }

  function hydrateFooter(c) {
    const line = document.querySelector(".ftr .fine");
    if (line && c.footer?.line) line.textContent = c.footer.line;
  }

  function hydrateNav(c) {
    const menuBtn = document.getElementById("menu-btn");
    if (menuBtn && c.contact?.headerMenuLabel) menuBtn.textContent = c.contact.headerMenuLabel;
    if (c.contact?.portfolioGalleryUrl) {
      document.querySelectorAll('a.nl[href*="gallery"], .menu a[href*="gallery"]').forEach((a) => {
        if (/portfolio\.chaoticstudio|\/gallery\//.test(a.getAttribute("href") || "")) {
          a.href = c.contact.portfolioGalleryUrl;
        }
      });
    }
    renderHeaderContact(c);
    renderMenuContact(c);
  }

  function hydrateAll(c) {
    hydrateMeta(c);
    hydrateNav(c);
    hydrateHero(c);
    hydrateAbout(c);
    hydrateServices(c);
    hydrateWhy(c);
    hydratePackages(c);
    hydrateWork(c);
    hydrateFinale(c);
    hydrateFooter(c);
  }

  async function boot() {
    let content;
    try {
      content = await fetchContent();
    } catch {
      content = null;
    }
    if (!content) return;
    window.__SITE_CONTENT__ = content;
    hydrateAll(content);
    document.dispatchEvent(new CustomEvent("cms-content-ready", { detail: content }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
