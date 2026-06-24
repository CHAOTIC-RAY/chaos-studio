import type { Portfolio } from "./types/portfolio";
import { CHAOS_LOGO_SVG, CHAOS_LOGO_SVG_HERO } from "./brand/logo";
import { portfolioUrl, studioUrl, galleryUrl } from "./router";
import {
  ICON_CHECK,
  ICON_CHEVRON_LEFT,
  ICON_CHEVRON_RIGHT,
  ICON_CLOSE,
  ICON_MENU,
  ICON_PRINT,
  ICON_TELEGRAM,
} from "./icons";
import { renderToolTag } from "./skill-icons";
import { studioPackageIcon } from "./studio-package-icons";
import { renderWorkMarquee } from "./render-work-marquee";
import {
  type DeviceMedia,
  PROJECT_MEDIA,
  PROJECT_LIVE_URL,
  PROJECT_LOGOS,
} from "./project-media";
import { renderStatsSection } from "./components/stats-section";
import { renderAwardsSection } from "./components/awards-section";
import { renderNewsSection } from "./components/news-section";
import { renderTestimonialsSection } from "./components/testimonials-section";
import { renderClientLogoWall } from "./components/client-logo-wall";
import { renderProcessSteps } from "./components/process-steps";

const POST_ACCENTS: Record<string, string> = {
  purple: "post-card--purple",
  pink: "post-card--pink",
  gold: "post-card--gold",
  teal: "post-card--teal",
};

function esc(s: string): string {
  if (typeof s !== "string") return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

type NavItem = { href: string; label: string; route?: boolean };

const PORTFOLIO_NAV: NavItem[] = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#posts", label: "Posts" },
  { href: "#work", label: "Work" },
  { href: "#skills", label: "Skills" },
  { href: galleryUrl(), label: "Gallery", route: true },
  { href: studioUrl(), label: "Studio", route: true },
  { href: "#contact", label: "Contact" },
];

const STUDIO_NAV: NavItem[] = [
  { href: galleryUrl(), label: "Gallery", route: true },
  { href: "#packages", label: "Packages" },
  { href: "#studio-contact", label: "Contact" },
];

const GALLERY_NAV: NavItem[] = [
  { href: portfolioUrl(), label: "Portfolio", route: true },
  { href: studioUrl(), label: "Studio", route: true },
];

function renderBgLayers(opts?: { includeHeroOrb?: boolean; studio?: boolean }): string {
  const includeHeroOrb = opts?.includeHeroOrb !== false;
  const studio = opts?.studio === true;
  return `
    <div class="bg-layers${studio ? " bg-layers--studio" : ""}" aria-hidden="true">
      <canvas id="bg-canvas"></canvas>
      <div class="bg-blobs"></div>
      <div class="bg-dither${studio ? " bg-dither--studio" : ""}" aria-hidden="true"></div>
      ${studio ? '<div class="bg-dither-noise" aria-hidden="true"></div>' : ""}
      <div class="bg-grain${studio ? " bg-grain--studio" : ""}"></div>
      ${studio ? '<div class="bg-logo-glow" aria-hidden="true"></div>' : ""}
      ${includeHeroOrb && !studio ? '<div class="hero-orb" data-parallax="24" aria-hidden="true"></div>' : ""}
    </div>`;
}

function renderNavLinks(items: NavItem[]): string {
  return items
    .map((l) => {
      const routeAttr = l.route ? ' data-route-link' : "";
      return `<a class="nav__link" href="${esc(l.href)}"${routeAttr}>${esc(l.label)}</a>`;
    })
    .join("");
}

function renderSiteChrome(
  p: Portfolio,
  opts: { mode: "portfolio" | "studio"; logoHref: string; nav: NavItem[]; showPrint?: boolean },
): string {
  const printBtn =
    opts.showPrint !== false
      ? `<button type="button" class="btn-icon btn-print" id="print-portfolio" aria-label="Print or save portfolio as PDF">
          ${ICON_PRINT}
        </button>`
      : "";
  const ctaHref =
    opts.mode === "studio" ? esc(p.chaosStudio.studioContact.instagramUrl) : esc(p.contact.telegramUrl);
  const ctaLabel = opts.mode === "studio" ? "Instagram" : "Contact";
  const ctaExternal = opts.mode === "studio" ? ' target="_blank" rel="noopener noreferrer"' : ' target="_blank" rel="noopener noreferrer"';

  return `
    ${renderBgLayers({ includeHeroOrb: opts.mode === "portfolio", studio: opts.mode === "studio" })}
    <div class="scroll-progress" aria-hidden="true"></div>
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="site-header ${opts.mode === "studio" ? "site-header--studio" : ""}">
      <a class="logo" href="${esc(opts.logoHref)}"${opts.mode === "studio" ? ' data-route-link' : ""}>
        ${CHAOS_LOGO_SVG}
        <span class="logo-text">${opts.mode === "studio" ? esc(p.chaosStudio.title) : esc(p.profile.name)}</span>
      </a>
      <div class="header-actions">
        ${printBtn}
        <a class="nav-cta" href="${ctaHref}"${ctaExternal}>${ctaLabel}</a>
      </div>
    </header>
    <nav class="bottom-nav" aria-label="Primary">
      ${renderNavLinks(opts.nav)}
    </nav>
    <button type="button" class="nav-toggle nav-toggle--fab" id="nav-toggle" aria-expanded="false" aria-controls="nav-drawer" aria-label="Open menu">
      <span class="nav-toggle__open">${ICON_MENU}</span>
      <span class="nav-toggle__close">${ICON_CLOSE}</span>
    </button>
    <div class="nav-drawer" id="nav-drawer" hidden>
      <div class="nav-drawer__backdrop" data-nav-close tabindex="-1" aria-hidden="true"></div>
      <nav class="nav nav--mobile" aria-label="Mobile">
        ${renderNavLinks(opts.nav)}
        <a class="nav-cta nav-cta--block" href="${ctaHref}"${ctaExternal}>${ctaLabel}</a>
      </nav>
    </div>`;
}

export function renderPage(p: Portfolio): string {
  return `
    ${renderSiteChrome(p, { mode: "portfolio", logoHref: "#top", nav: PORTFOLIO_NAV, showPrint: true })}

    <main id="main">
      <section id="top" class="hero">
        <p class="hero-eyebrow eyebrow" data-parallax="6">${esc(p.profile.tagline)}</p>
        <h1 class="hero-title" data-parallax="10">
          <span class="hero-line">${esc(p.profile.name)}</span>
          <span class="hero-line hero-line--dim">Visual stories</span>
        </h1>
        <p class="hero-sub">${esc(p.profile.role)} · ${esc(p.objective.body.slice(0, 120))}…</p>
        <div class="hero-actions" data-parallax="8">
          <a class="btn btn-primary" href="#work" data-magnetic>View featured work</a>
          <a class="btn btn-ghost" href="${galleryUrl()}" data-route-link data-magnetic>Gallery</a>
          <a class="btn btn-ghost" href="#contact" data-magnetic>Get in touch</a>
        </div>
        <div class="print-clients" hidden>
          <p class="eyebrow">Clients &amp; services</p>
          <p class="print-clients__text">Rainbow Enterprise · Reach MV · Haus of Paws · Islanders · Nutrition · Digital Dive · Motion Graphics · Unicare · Logo Design · Strategy · Marketing · Content</p>
        </div>
        ${renderWorkMarquee({})}
        <div class="scroll-cue" aria-hidden="true"><span>Scroll</span><span class="scroll-line"></span></div>
      </section>

      <section id="about" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">About</p>
          <h2>${esc(p.objective.title)}</h2>
        </div>
        <div class="grid-2" data-reveal>
          <div class="glass-card">
            <p class="lead">${esc(p.objective.body)}</p>
          </div>
          <div class="glass-card glass-card--compact">
            <h3>Soft skills</h3>
            <div class="pills">${p.softSkills.map((s) => `<span class="pill">${esc(s)}</span>`).join("")}</div>
            <h3>Interests</h3>
            <div class="pills">${p.interests.map((i) => `<span class="pill pill--outline">${esc(i.emoji)} ${esc(i.label)}</span>`).join("")}</div>
          </div>
        </div>
      </section>

      <section id="experience" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Experience</p>
          <h2>${esc(p.experience.subtitle)}</h2>
        </div>
        <div class="stack">
          ${p.experience.items
            .map(
              (job) => `
            <article class="glass-card exp-card ${job.featured ? "exp-card--featured" : ""}" data-reveal>
              <div class="exp-head">
                <span class="exp-logo">${esc(job.logo)}</span>
                <div>
                  <h3>${esc(job.company)}</h3>
                  <p class="exp-role">${esc(job.role)}</p>
                </div>
                <span class="date-pill">${esc(job.period)}</span>
              </div>
              ${job.description ? `<p>${esc(job.description)}</p>` : ""}
              ${job.bullets ? `<ul class="bullet-list">${job.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            </article>
          `,
            )
            .join("")}
        </div>
      </section>

      <section id="posts" class="section">
        ${renderPostsSection(p.socialPosts)}
      </section>

      <section id="work" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Featured work</p>
          <h2>${esc(p.featuredWork.subtitle)}</h2>
        </div>
        <div class="work-stack">
          ${(p.workCards || []).map((card, i) => {
            const extra = p.featuredWork.projects.find(proj => proj.id.toLowerCase() === card.slug.toLowerCase());
            const merged = {
              ...extra,
              id: card.slug,
              name: card.title,
              tagline: extra?.tagline || card.category,
              description: extra?.description || "",
              href: card.href,
              cta: extra?.cta || "View Project",
              accent: extra?.accent || "neutral",
              highlights: extra?.highlights || [],
              tags: extra?.tags || [],
              slug: card.slug,
              year: card.year,
              cover: card.cover,
              coverAlt: card.coverAlt,
              category: card.category,
              featuredCard: card.featured
            };
            return renderProject(merged as any, i);
          }).join("")}
        </div>
      </section>

      ${p.sections?.showStats ? renderStatsSection({
        subtitle: "Our impact in numbers",
        stats: [
          { id: "projects", label: "Projects delivered", value: "150+", icon: "projects-icon" },
          { id: "clients", label: "Happy clients", value: "97", icon: "clients-icon" },
          { id: "years", label: "Years active", value: "5+", icon: "years-icon" },
          { id: "satisfaction", label: "Client satisfaction", value: "98%", icon: "satisfaction-icon" }
        ]
      }) : ""}

      ${p.sections?.showAwards ? renderAwardsSection({
        subtitle: "Recognition & achievements",
        awards: [
          { id: "award-1", title: "Best Design Portfolio 2024", organization: "Maldives Design Awards", year: "2024", description: "Recognized for excellence in portfolio design and user experience" },
          { id: "award-2", title: "Top Creative Studio", organization: "Regional Business Awards", year: "2023", description: "Awarded for outstanding creative work and client satisfaction" }
        ]
      }) : ""}

      ${p.sections?.showNews ? renderNewsSection({
        subtitle: "Latest updates",
        news: [
          { id: "news-1", title: "Launching new branding packages", date: "2024-06-15", category: "Studio Update", excerpt: "Introducing comprehensive branding solutions for businesses of all sizes", content: "" },
          { id: "news-2", title: "Case study: Rainbow Enterprise rebrand", date: "2024-05-20", category: "Case Study", excerpt: "How we transformed a local furniture brand's digital presence", content: "" },
          { id: "news-3", title: "Expanding our service offerings", date: "2024-04-10", category: "Studio Update", excerpt: "New services including app design and marketing videos", content: "" }
        ]
      }, p.sections.newsCount || 3) : ""}

      ${p.clientLogoWall?.enabled ? renderClientLogoWall(p.clientLogoWall) : ""}

      <section id="skills" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Skills & education</p>
          <h2>${esc(p.skills.subtitle)}</h2>
        </div>
        <div class="skills-grid" data-reveal>
          ${p.skills.categories
            .map(
              (cat) => `
            <div class="glass-card skill-card ${cat.variant === "primary" ? "skill-card--primary" : ""}">
              <h3>${esc(cat.title)}</h3>
              ${cat.description ? `<p>${esc(cat.description)}</p>` : ""}
              <div class="tools">${cat.tools.map((t) => renderToolTag(t)).join("")}</div>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="edu-grid" data-reveal>
          ${p.education
            .map(
              (e) => `
            <div class="glass-card edu-card">
              <h3>${esc(e.degree)}</h3>
              <p>${esc(e.school)}</p>
              ${e.detail ? `<p class="muted">${esc(e.detail)}</p>` : ""}
              <span class="date-pill">${esc(e.period)}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </section>

      <section id="studio" class="section section--studio-teaser">
        ${renderStudioTeaser(p.chaosStudio)}
      </section>

      <section id="contact" class="section section--contact">
        <div class="contact-banner" data-reveal>
          <div class="contact-banner__glow" aria-hidden="true"></div>
          <div class="contact-banner__inner">
            <div class="contact-banner__copy">
              <p class="eyebrow">Get in touch</p>
              <h2>Let's work together</h2>
              <p class="contact-banner__lead">
                Brand campaigns, social content, or product design — reach out on Telegram for a quick reply.
              </p>
            </div>
            <div class="contact-banner__actions">
              <a class="btn btn-primary" href="${esc(p.contact.telegramUrl)}" target="_blank" rel="noopener noreferrer">
                ${ICON_TELEGRAM}
                Message Wafig
              </a>
              <div class="contact-banner__social">
                <a href="${esc(p.contact.instagramUrl)}" target="_blank" rel="noopener noreferrer">Instagram</a>
                <span>•</span>
                <a href="${esc(p.contact.whatsappUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          ${CHAOS_LOGO_SVG}
          <p class="footer-tagline">Visual stories that connect.</p>
        </div>
        <div class="footer-copy">
          <p>&copy; ${new Date().getFullYear()} Ibrahim Wafig. All rights reserved.</p>
          <div class="footer-links">
             <a href="#top">Back to top</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

export function renderStudioPage(p: Portfolio): string {
  const s = p.chaosStudio;
  return `
    ${renderSiteChrome(p, { mode: "studio", logoHref: studioUrl(), nav: STUDIO_NAV })}

    <main id="main">
      <section id="studio-hero" class="hero hero--studio">
        <p class="hero-eyebrow eyebrow" data-parallax="6">${esc(s.tagline)}</p>
        <h1 class="hero-title" data-parallax="10">
          <span class="hero-line">${esc(s.headline)}</span>
        </h1>
        <p class="hero-sub">${esc(s.pitch)}</p>
        <div class="hero-actions" data-parallax="8">
          <a class="btn btn-primary" href="#packages" data-magnetic>View packages</a>
          <a class="btn btn-ghost" href="#studio-contact" data-magnetic>Get a quote</a>
        </div>
        ${renderWorkMarquee({})}
      </section>

      <section id="services" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Services</p>
          <h2>${esc(s.title)} offerings</h2>
        </div>
        <div class="grid-3" data-reveal>
          ${s.services
            .map(
              (svc) => `
            <div class="glass-card svc-card">
              <h3>${esc(svc)}</h3>
            </div>
          `,
            )
            .join("")}
        </div>
      </section>

      <section id="packages" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Pricing</p>
          <h2>Select a package</h2>
        </div>
        <div class="packages-grid">
          ${s.packages
            .map(
              (pkg) => `
            <div class="glass-card pkg-card ${pkg.recommended ? "pkg-card--featured" : ""}" data-reveal>
              ${pkg.recommended ? '<span class="pkg-badge">Recommended</span>' : ""}
              <div class="pkg-icon">${studioPackageIcon(pkg.id)}</div>
              <h3>${esc(pkg.name)}</h3>
              <p class="pkg-tagline">${esc(pkg.tagline)}</p>
              <div class="pkg-price">
                <span class="pkg-currency">${esc(pkg.currency)}</span>
                <span class="pkg-amount">${esc(pkg.price)}</span>
              </div>
              <ul class="pkg-features">
                ${pkg.features.map((f) => `<li>${ICON_CHECK} ${esc(f)}</li>`).join("")}
              </ul>
              <a class="btn ${pkg.recommended ? "btn-primary" : "btn-ghost"} btn-block" href="${esc(s.studioContact.instagramUrl)}" target="_blank" rel="noopener noreferrer">Get started</a>
            </div>
          `,
            )
            .join("")}
        </div>
        <p class="pricing-note" data-reveal>${esc(s.pricingNote)}</p>
      </section>

      ${p.sections?.showProcess ? renderProcessSteps(s.process || []) : ""}

      ${s.testimonials && s.testimonials.length > 0 ? renderTestimonialsSection(s.testimonials) : ""}

      ${s.featuredWork && s.featuredWork.length > 0 ? `
        <section class="section">
          <div class="section-head" data-reveal>
            <p class="eyebrow">Work</p>
            <h2>Featured studio projects</h2>
          </div>
          <div class="grid-2">
            ${s.featuredWork.map(w => `
              <a href="${esc(w.link)}" class="glass-card studio-work-card" data-reveal target="_blank" rel="noopener noreferrer">
                <img src="${esc(w.image)}" alt="${esc(w.title)}" loading="lazy" />
                <div class="studio-work-content">
                  <span class="eyebrow">${esc(w.category)}</span>
                  <h3>${esc(w.title)}</h3>
                  ${w.results ? `<p class="results">${esc(w.results)}</p>` : ""}
                </div>
              </a>
            `).join("")}
          </div>
        </section>
      ` : ""}

      <section id="studio-contact" class="section">
        <div class="glass-card contact-card" data-reveal>
          <div class="contact-grid">
            <div class="contact-info">
              <p class="eyebrow">Contact</p>
              <h2>Start your project</h2>
              <p>${esc(s.description)}</p>
              <div class="contact-methods">
                <a href="${esc(s.studioContact.instagramUrl)}" class="contact-method" target="_blank" rel="noopener noreferrer">
                  <span>Instagram</span>
                  <strong>${esc(s.studioContact.instagram)}</strong>
                </a>
                <div class="contact-method">
                  <span>Email</span>
                  <strong>${esc(s.studioContact.email)}</strong>
                </div>
                <div class="contact-method">
                  <span>Phone</span>
                  <strong>${esc(s.studioContact.phones)}</strong>
                </div>
              </div>
            </div>
            <div class="contact-visual">
              <div class="contact-glow"></div>
              ${CHAOS_LOGO_SVG}
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

export function renderGalleryPage(p: Portfolio): string {
  return `
    ${renderSiteChrome(p, { mode: "portfolio", logoHref: portfolioUrl(), nav: GALLERY_NAV })}
    <main id="main">
      <section class="gallery-hero">
        <div class="gallery-hero__inner">
          <p class="eyebrow" data-reveal>${esc(p.gallery.tagline)}</p>
          <h1 data-reveal>${esc(p.gallery.headline)}</h1>
          <p class="lead" data-reveal>${esc(p.gallery.pitch)}</p>
        </div>
      </section>
      <div id="pano-container" class="pano-container">
        <div class="pano-hint">
          <span>${ICON_CHEVRON_LEFT}</span>
          <span>Scroll to explore</span>
          <span>${ICON_CHEVRON_RIGHT}</span>
        </div>
        <div id="pano-track" class="pano-track">
          <!-- Panoramic items injected by gallery-panorama.ts -->
          <div class="pano-loading">Loading gallery...</div>
        </div>
      </div>
    </main>
  `;
}

function renderStudioTeaser(s: Portfolio["chaosStudio"]): string {
  return `
    <div class="studio-teaser" data-reveal>
      <div class="studio-teaser__content">
        <p class="eyebrow">Chaos Studio</p>
        <h2>${esc(s.headline)}</h2>
        <p>${esc(s.pitch)}</p>
        <div class="studio-teaser__actions">
          <a class="btn btn-primary" href="${studioUrl()}" data-route-link data-magnetic>View studio</a>
          <a class="btn btn-ghost" href="${esc(s.studioContact.instagramUrl)}" target="_blank" rel="noopener noreferrer" data-magnetic>Instagram</a>
        </div>
      </div>
      <div class="studio-teaser__visual">
        <div class="studio-teaser__glow"></div>
        ${CHAOS_LOGO_SVG_HERO}
      </div>
    </div>
  `;
}

function renderPostsSection(s: Portfolio["socialPosts"]): string {
  const posts = s.items || [];
  const clients = Array.from(new Set(posts.map((p) => p.client))).sort();
  const tabs = ["All", ...clients]
    .map(
      (c, i) =>
        `<button type="button" class="posts-tabs__btn ${i === 0 ? "is-active" : ""}" data-filter="${c === "All" ? "all" : esc(c)}">${esc(c)}</button>`,
    )
    .join("");

  return `
    <div class="section-head" data-reveal>
      <p class="eyebrow">Campaigns</p>
      <h2>${esc(s.subtitle)}</h2>
    </div>
    <div class="posts-feed" data-posts-feed>
      <div class="posts-tabs-wrap" data-posts-tabs-wrap>
        <button class="posts-tabs-nav posts-tabs-nav--prev" data-posts-tabs-prev aria-label="Scroll tabs left">${ICON_CHEVRON_LEFT}</button>
        <div class="posts-tabs" data-posts-tabs role="tablist">
          ${tabs}
        </div>
        <button class="posts-tabs-nav posts-tabs-nav--next" data-posts-tabs-next aria-label="Scroll tabs right">${ICON_CHEVRON_RIGHT}</button>
      </div>
      <div class="posts-rail-viewport" data-posts-rail-viewport>
        <div class="posts-rail" data-posts-rail>
          ${posts.map((p) => renderPostCard(p, { feed: "rail" })).join("")}
        </div>
      </div>
      <div class="posts-rail-nav">
        <button class="btn-icon" data-posts-prev aria-label="Previous posts">${ICON_CHEVRON_LEFT}</button>
        <button class="btn-icon" data-posts-next aria-label="Next posts">${ICON_CHEVRON_RIGHT}</button>
      </div>
    </div>
  `;
}

function postCardLayout(post: Portfolio["socialPosts"]["items"][0]): string {
  return post.cardLayout || "default";
}

function postAspectClass(post: Portfolio["socialPosts"]["items"][0]): string {
  const a = post.mediaAspect || "portrait";
  return `post-card--aspect-${a}`;
}

function postImageBase(post: Portfolio["socialPosts"]["items"][0]): string {
  return post.image || post.id;
}

function postKindLabel(post: Portfolio["socialPosts"]["items"][0]): string {
  if (post.video) return "Video / Reel";
  const layout = postCardLayout(post);
  if (layout === "poster") return "Poster";
  if (layout === "media-kit") return "Media Kit";
  if (post.slides && post.slides.length > 1) return "Carousel";
  return "Static Post";
}

function renderPostViewButton(post: Portfolio["socialPosts"]["items"][0]): string {
  return `<button type="button" class="post-card__view-btn" data-post-expand="${esc(post.id)}" aria-label="View ${esc(post.title)} details">View Details</button>`;
}

function renderSlideCounter(current: number, total: number): string {
  return `<span class="post-card__slide-counter" data-slide-counter aria-hidden="true">${current} / ${total}</span>`;
}

function renderPostSlideImg(
  post: Portfolio["socialPosts"]["items"][0],
  slide: string,
  opts: { slideIndex: number; slideCount: number; eager: boolean; filmstrip?: boolean },
): string {
  const base = postImageBase(post);
  const src = `/images/posts/${slide}.webp`;
  const loading = opts.eager ? "eager" : "lazy";
  const className = opts.filmstrip ? "post-card__filmstrip-img" : "post-card__img";
  return `
    <img
      class="${className}"
      src="${src}"
      alt="${esc(post.title)} — slide ${opts.slideIndex + 1} of ${opts.slideCount}"
      loading="${loading}"
      data-post-id="${esc(post.id)}"
      data-image-base="${esc(base)}"
      data-slide-index="${opts.slideIndex}"
    />`;
}

function renderPostVideo(post: Portfolio["socialPosts"]["items"][0]): string {
  const videoSrc = `/images/posts/${post.video}`;
  const posterSrc = post.poster ? `/images/posts/${post.poster}` : "";
  return `
    <div class="post-card__video-wrap">
      <video
        class="post-card__video"
        src="${videoSrc}"
        poster="${posterSrc}"
        loop
        muted
        playsinline
        preload="metadata"
      ></video>
      <button type="button" class="post-card__unmute" aria-label="Toggle audio" aria-pressed="true">Unmute</button>
    </div>`;
}

function renderPostPosterFull(post: Portfolio["socialPosts"]["items"][0]): string {
  const slide = post.slides?.[0] || postImageBase(post);
  return `
    <div class="post-card__poster-full">
      ${renderPostSlideImg(post, slide, { slideIndex: 0, slideCount: 1, eager: false })}
    </div>
    ${renderPostViewButton(post)}`;
}

function renderPostMediaKitGrid(post: Portfolio["socialPosts"]["items"][0], slides: string[]): string {
  const count = slides.length;
  const cells = slides
    .map(
      (slide, i) => `
        <figure class="post-card__kit-cell">
          ${renderPostSlideImg(post, slide, { slideIndex: i, slideCount: count, eager: i < 3 })}
          <span class="post-card__kit-page" aria-hidden="true">${i + 1}</span>
        </figure>`,
    )
    .join("");
  return `
    <div class="post-card__kit-grid post-card__kit-grid--${count}" data-media-kit-grid aria-label="${esc(post.title)} — ${count} pages, full media kit">
      ${cells}
    </div>
    ${renderPostViewButton(post)}`;
}

function renderPostFilmstrip(post: Portfolio["socialPosts"]["items"][0], slides: string[]): string {
  const count = slides.length;
  const figures = slides
    .map(
      (slide, i) => `
        <figure class="post-card__filmstrip-slide">
          ${renderPostSlideImg(post, slide, { slideIndex: i, slideCount: count, eager: i < 2, filmstrip: true })}
        </figure>`,
    )
    .join("");
  return `
    <div class="post-card__filmstrip" data-filmstrip>
      <div
        class="post-card__filmstrip-track"
        tabindex="0"
        aria-label="${esc(post.title)} — ${count} slides, swipe horizontally"
      >
        ${figures}
      </div>
      ${renderSlideCounter(1, count)}
    </div>
    ${renderPostViewButton(post)}`;
}

function renderPostMedia(post: Portfolio["socialPosts"]["items"][0], mode: "rail" | "expanded" = "rail"): string {
  if (post.video) {
    return `${renderPostVideo(post)}${renderPostViewButton(post)}`;
  }

  const layout = postCardLayout(post);
  const slides =
    post.slides?.length && post.slides.length > 0
      ? post.slides
      : [postImageBase(post)];

  if (layout === "poster") {
    return renderPostPosterFull(post);
  }

  if (layout === "media-kit" && slides.length > 1) {
    return renderPostMediaKitGrid(post, slides);
  }

  if (slides.length === 1) {
    return `${renderPostSlideImg(post, slides[0], { slideIndex: 0, slideCount: 1, eager: false })}${renderPostViewButton(post)}`;
  }

  if (mode === "expanded") {
    return renderPostFilmstrip(post, slides);
  }

  const count = slides.length;
  const imgs = slides
    .map((slide, i) => renderPostSlideImg(post, slide, { slideIndex: i, slideCount: count, eager: i === 0 }))
    .join("");
  return `
    <div class="post-card__carousel post-card__carousel--${count}" style="--slide-count:${count}" aria-label="${esc(post.title)} carousel">
      ${imgs}
      ${renderSlideCounter(1, count)}
    </div>
    ${renderPostViewButton(post)}`;
}

function renderPostCard(post: Portfolio["socialPosts"]["items"][0], opts?: { feed?: "rail" | "expanded" }): string {
  const feed = opts?.feed ?? "rail";
  const isFeed = feed === "expanded";
  const accent = POST_ACCENTS[post.accent] ?? "post-card--purple";
  const layout = postCardLayout(post);
  const aspect = postAspectClass(post);
  const slideCount = post.slides?.length ?? 0;
  const filmstrip = isFeed && slideCount > 1 && layout !== "media-kit";
  const kind = post.video
    ? "post-card--video"
    : layout === "poster"
      ? "post-card--poster-full"
      : layout === "media-kit"
        ? "post-card--media-kit-full"
        : filmstrip
          ? "post-card--filmstrip"
          : slideCount > 1
            ? "post-card--carousel"
            : "";
  const postKind = post.video
    ? "video"
    : layout === "poster"
      ? "poster-full"
      : layout === "media-kit"
        ? "media-kit-full"
        : filmstrip
          ? "filmstrip"
          : slideCount > 1
            ? "carousel"
            : "image";
  const meta = `
        <div class="post-card__meta">
          <span class="post-card__platform">${esc(post.platform)}</span>
          <span class="post-card__kind">${esc(postKindLabel(post))}</span>
        </div>`;

  return `
    <article class="post-card ${accent} ${aspect} ${kind}${isFeed ? " post-card--feed post-card--feed-grid" : ""}${layout ? ` post-card--layout-${layout}` : ""}" data-post-kind="${postKind}" data-post-id="${esc(post.id)}">
      <div class="post-card__media${filmstrip ? " post-card__media--filmstrip" : ""}${layout === "poster" ? " post-card__media--poster-full" : ""}${layout === "media-kit" ? " post-card__media--kit-full" : ""}">
        ${renderPostMedia(post, feed)}
        <div class="post-card__shine" aria-hidden="true"></div>
      </div>
      <div class="post-card__body">
        ${isFeed ? meta : `<p class="post-card__client">${esc(post.client)}</p>`}
        <h3 class="post-card__title">${esc(post.title)}</h3>
        ${post.description?.trim() ? `<p class="post-desc">${esc(post.description)}</p>` : ""}
        <div class="post-tags">${post.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function renderScreenMedia(media: DeviceMedia, label: string, kind: "desktop" | "mobile"): string {
  const alt = `${esc(label)} — ${kind} app in use`;
  if (media.frames && media.frames.length > 1) {
    const count = media.frames.length;
    const slides = media.frames
      .map(
        (src, i) =>
          `<img class="device__slide" src="${src}" alt="${alt}" loading="${i === 0 ? "eager" : "lazy"}" style="--slide-i:${i};--slide-count:${count}" />`,
      )
      .join("");
    return `<div class="device__carousel device__carousel--${count}" aria-label="${alt}">${slides}</div>`;
  }
  return `<img class="device__media" src="${media.image}" alt="${alt}" loading="lazy" width="${kind === "desktop" ? 1200 : 390}" height="${kind === "desktop" ? 750 : 844}" />`;
}

function renderBrowserFrame(
  media: DeviceMedia,
  label: string,
  liveUrl: string,
  siteHref: string,
  logo?: string,
): string {
  const favicon = logo
    ? `<img class="device__favicon" src="${logo}" alt="" width="18" height="18" loading="lazy" />`
    : "";
  return `
    <div class="device device--browser" aria-label="${esc(label)} desktop preview">
      <div class="device__chrome">
        <span class="device__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="device__chrome-brand">${favicon}<a class="device__url" href="${esc(siteHref)}" target="_blank" rel="noopener noreferrer">${esc(liveUrl)}</a></span>
      </div>
      <div class="device__screen">
        ${renderScreenMedia(media, label, "desktop")}
      </div>
    </div>
  `;
}

function renderPhoneFrame(media: DeviceMedia, label: string, logo?: string): string {
  const appIcon = logo
    ? `<img class="device__app-icon" src="${logo}" alt="" width="20" height="20" loading="lazy" />`
    : "";
  return `
    <div class="device device--phone" aria-label="${esc(label)} mobile preview">
      <div class="device__bezel">
        ${appIcon}
        <span class="device__notch" aria-hidden="true"></span>
        <div class="device__screen">
          ${renderScreenMedia(media, label, "mobile")}
        </div>
      </div>
    </div>
  `;
}

function renderProjectHead(proj: any, featured: boolean): string {
  const label = featured ? "Featured product" : (proj.category || "Web & mobile");
  const logo = PROJECT_LOGOS[proj.id];
  if (!logo) {
    return `<span class="work-showcase__label">${label}</span><h3>${esc(proj.name)}</h3>`;
  }
  return `
          <div class="work-showcase__brand">
            <img class="work-showcase__logo" src="${logo}" alt="${esc(proj.name)} logo" width="80" height="80" loading="lazy" />
            <div class="work-showcase__brand-copy">
              <span class="work-showcase__label">${label}</span>
              <h3>${esc(proj.name)}</h3>
            </div>
          </div>`;
}

function renderProject(proj: any, index: number): string {
  const media = PROJECT_MEDIA[proj.id] ?? {};
  const liveUrl = PROJECT_LIVE_URL[proj.id] ?? proj.name;
  const featured = index === 0;
  const logo = PROJECT_LOGOS[proj.id];

  const devices: string[] = [];
  if (media.desktop) devices.push(renderBrowserFrame(media.desktop, proj.name, liveUrl, proj.href, logo));
  if (media.mobile) devices.push(renderPhoneFrame(media.mobile, proj.name, logo));

  const deviceInner =
    devices.length > 1
      ? `<div class="work-showcase__composition">${devices.join("")}</div>`
      : devices.join("");

  let deviceBlock = "";
  if (devices.length > 0) {
    deviceBlock = `<div class="work-showcase__devices ${devices.length > 1 ? "work-showcase__devices--dual" : "work-showcase__devices--solo"}" data-tilt-showcase>
          ${deviceInner}
        </div>`;
  } else if (proj.cover) {
    deviceBlock = `<div class="work-showcase__devices work-showcase__devices--cover" data-tilt-showcase>
      <img class="work-showcase__cover-img" src="${esc(proj.cover)}" alt="${esc(proj.coverAlt)}" loading="lazy" />
    </div>`;
  } else {
    deviceBlock = `<div class="work-showcase__devices work-showcase__devices--placeholder"><span>${esc(proj.name)}</span></div>`;
  }

  const highlights = proj.highlights && proj.highlights.length > 0
    ? `<ul class="work-showcase__highlights">${proj.highlights.map((h: string) => `<li>${esc(h)}</li>`).join("")}</ul>`
    : "";

  const tags = proj.tags && proj.tags.length > 0
    ? `<div class="work-showcase__tags">${proj.tags.slice(0, 6).map((t: string) => `<span>${esc(t)}</span>`).join("")}</div>`
    : "";

  return `
    <article class="work-showcase work-showcase--${esc(proj.id)} ${featured ? "work-showcase--featured" : ""}" data-reveal data-pano-tilt="5" id="project-${esc(proj.id)}">
      <div class="work-showcase__glow" aria-hidden="true"></div>
      <div class="work-showcase__stage">
        ${deviceBlock}
        <div class="work-showcase__panel">
          ${renderProjectHead(proj, featured)}
          <p class="work-showcase__tagline">${esc(proj.tagline)}</p>
          ${proj.description ? `<p class="work-showcase__desc">${esc(proj.description)}</p>` : ""}
          ${highlights}
          ${tags}
          <a class="btn btn-primary btn-sm work-showcase__cta" href="${esc(proj.href)}" target="_blank" rel="noopener noreferrer">${esc(proj.cta)}</a>
        </div>
      </div>
    </article>
  `;
}
