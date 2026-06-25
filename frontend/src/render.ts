import type { Portfolio } from "./types/portfolio";
import { CHAOS_LOGO_SVG, CHAOS_LOGO_SVG_HERO } from "./brand/logo";
import { portfolioUrl, studioUrl, galleryUrl } from "./router";
import {
  ICON_CHECK,
  ICON_CHEVRON_LEFT,
  ICON_CHEVRON_RIGHT,
  ICON_CLOSE,
  ICON_FILTER,
  ICON_GRID,
  ICON_LIST,
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
import { renderProject } from "./components/work-card";
import { renderPostsSection } from "./components/social-post";

const POST_ACCENTS: Record<string, string> = {
  purple: "post-card--purple",
  pink: "post-card--pink",
  gold: "post-card--gold",
  teal: "post-card--teal",
};

function esc(s: string): string {
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
        ${renderWorkMarquee()}
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
          ${(p.workCards ?? p.featuredWork.projects as any).map((proj: any, i: number) => renderProject(proj, i)).join("")}
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
              <a
                class="btn btn-primary contact-banner__cta"
                href="${esc(p.contact.telegramUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                data-magnetic
              >
                ${ICON_TELEGRAM}
                <span>Message ${esc(p.contact.telegram)} on Telegram</span>
              </a>
              <ul class="contact-banner__links">
                <li><a href="mailto:${esc(p.contact.email)}">${esc(p.contact.email)}</a></li>
                <li><a href="tel:${esc(p.contact.phone.replace(/\s/g, ""))}">${esc(p.contact.phone)}</a></li>
                <li><a href="${esc(p.contact.instagramUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.contact.instagram)}</a></li>
                <li><a href="${esc(p.contact.whatsappUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              </ul>
              <p class="contact-banner__studio">
                <strong>${esc(p.chaosStudio.title)}</strong> —
                <a href="${esc(p.chaosStudio.studioContact.instagramUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.chaosStudio.studioContact.instagram)}</a>
                · <a href="tel:+9607339104">+960 7339104</a>
                · <a href="mailto:${esc(p.chaosStudio.studioContact.email)}">${esc(p.chaosStudio.studioContact.email)}</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${esc(p.profile.name)} · ${esc(p.profile.role)}</p>
      <a href="${esc(p.contact.telegramUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.contact.telegram)} on Telegram</a>
    </footer>
  `;
}

export function renderStudioPage(p: Portfolio): string {
  const studio = p.chaosStudio;
  const sc = studio.studioContact;
  return `
    ${renderSiteChrome(p, { mode: "studio", logoHref: portfolioUrl(), nav: STUDIO_NAV, showPrint: false })}
    <main id="main" class="page-studio">
      <section class="studio-page-hero" aria-labelledby="studio-page-title">
        <div class="studio-page-hero__frame" data-reveal>
          <div class="studio-page-logo" aria-hidden="true">
            <div class="studio-page-logo__dither-ring" aria-hidden="true"></div>
            <div class="studio-page-logo__mark">${CHAOS_LOGO_SVG_HERO}</div>
          </div>
          <p class="eyebrow studio-page-hero__eyebrow">${esc(studio.tagline)}</p>
          <h1 id="studio-page-title" class="studio-page-hero__title">${esc(studio.title)}</h1>
          <p class="studio-page-hero__headline">${esc(studio.headline)}</p>
          <p class="studio-page-hero__pitch lead">${esc(studio.pitch)}</p>
          <div class="studio-services studio-page-hero__services" aria-label="Services we provide">
            ${renderStudioServicePills(studio.services)}
          </div>
          <div class="studio-page-hero__actions">
            <a class="btn btn-primary" href="#packages" data-magnetic>View packages</a>
            <a class="btn btn-ghost" href="${esc(sc.instagramUrl)}" target="_blank" rel="noopener noreferrer" data-magnetic>${esc(sc.instagram)}</a>
          </div>
        </div>
      </section>
      <div class="studio-page-body section section--studio">
        ${renderStudioContent(studio, { omitHero: true })}
        ${studio.stats ? `
          <div class="section-head" data-reveal>
            <p class="eyebrow">${esc(studio.stats.subtitle || "Our impact")}</p>
          </div>
          <div class="stats-grid" data-reveal>
            ${studio.stats.metrics.map((metric) => `
              <div class="stat-card glass-card" data-stat-card>
                <div class="stat-value" data-count-up="${esc(metric.value)}">${esc(metric.value)}</div>
                <div class="stat-label">${esc(metric.label)}</div>
                ${metric.description ? `<div class="stat-desc">${esc(metric.description)}</div>` : ""}
              </div>
            `).join("")}
          </div>
        ` : ""}
        ${p.sections?.showProcess && studio.process && studio.process.length ? renderProcessSteps(studio.process) : ""}
        ${studio.testimonials && studio.testimonials.length ? renderTestimonialsSection(studio.testimonials) : ""}
      </div>
      ${renderStudioFinale(studio)}
    </main>
    <footer class="site-footer site-footer--studio">
      <p>© ${new Date().getFullYear()} ${esc(studio.title)} · Malé, Maldives</p>
    </footer>
  `;
}

export function renderGalleryPage(p: Portfolio): string {
  const gallery = p.gallery;
  return `
    ${renderSiteChrome(p, { mode: "studio", logoHref: portfolioUrl(), nav: GALLERY_NAV, showPrint: false })}
    <main id="main" class="page-gallery">
      <div class="pano__loader" data-pano-loader role="status" aria-live="polite" aria-busy="true" aria-label="Loading gallery">
        <div class="pano__loader-glow" aria-hidden="true"></div>
        <div class="pano__loader-logo">${CHAOS_LOGO_SVG}</div>
        <p class="pano__loader-label">Chaos Studio</p>
        <div class="pano__loader-track" aria-hidden="true"><span class="pano__loader-bar" data-pano-loader-bar></span></div>
      </div>
      <div class="pano" data-pano-root data-view="grid">
        <div class="pano__stage" data-pano-stage aria-label="Panoramic gallery — drag to explore">
          <div class="pano__plane" data-pano-plane></div>
        </div>
        <div class="pano__fx" aria-hidden="true">
          <div class="pano__edge-blur"></div>
          <div class="pano__vignette"></div>
        </div>
        <div class="pano__corner">
          <p class="eyebrow">${esc(gallery.tagline)}</p>
          <h1 class="pano__title">${esc(gallery.title)}</h1>
        </div>
        <div class="pano__list" data-pano-list role="list"></div>
        <div class="pano__hint" data-pano-hint aria-hidden="true">
          <span class="pano__hint-dot"></span> Drag to explore · click to open
        </div>
        <div class="pano__controls">
          <div class="pano__views" role="group" aria-label="Gallery layout">
            <button type="button" class="pano__view" data-pano-view="grid" aria-pressed="true" aria-label="Panoramic view">${ICON_GRID}</button>
            <button type="button" class="pano__view" data-pano-view="list" aria-pressed="false" aria-label="List view">${ICON_LIST}</button>
          </div>
          <div class="pano__filter-wrap">
            <button type="button" class="pano__filter-btn" data-pano-filter-btn aria-expanded="false" aria-haspopup="menu">
              ${ICON_FILTER}<span data-pano-filter-label>Filter</span>
            </button>
            <div class="pano__filter" data-pano-filter role="menu"></div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderStudioTeaser(studio: ChaosStudio): string {
  return `
        <div class="studio-teaser" data-reveal>
          <div class="studio-teaser__glow" aria-hidden="true"></div>
          <div class="studio-teaser__inner">
            <div class="studio-teaser__copy">
              <p class="eyebrow">${esc(studio.tagline)}</p>
              <h2 class="studio-teaser__title">${esc(studio.title)}</h2>
              <p class="lead studio-teaser__pitch">${esc(studio.headline)}</p>
              <p class="muted studio-teaser__hint">Services, packages, and studio contact — on a dedicated page.</p>
            </div>
            <div class="studio-teaser__actions">
              <a class="btn btn-primary" href="${studioUrl()}" data-route-link data-magnetic>Explore Chaos Studio</a>
              <a class="btn btn-ghost" href="${esc(studio.studioContact.instagramUrl)}" target="_blank" rel="noopener noreferrer">${esc(studio.studioContact.instagram)}</a>
            </div>
          </div>
        </div>`;
}

type SocialPost = Portfolio["socialPosts"]["items"][0];
type ChaosStudio = Portfolio["chaosStudio"];

function renderStudioServicePills(services: string[]): string {
  return services.map((s) => `<span class="studio-service">${esc(s)}</span>`).join("");
}

function renderStudioPackage(pkg: Portfolio["chaosStudio"]["packages"][0]): string {
  const featureItems = pkg.features
    .map(
      (f) => `
            <li class="studio-package__feature">
              <span class="studio-package__check">${ICON_CHECK}</span>
              <span class="studio-package__feature-text">${esc(f)}</span>
            </li>`,
    )
    .join("");
  const badge = pkg.recommended
    ? `<span class="studio-package__badge">Recommended</span>`
    : "";
  const icon = studioPackageIcon(pkg.id);
  return `
        <article class="studio-package ${pkg.recommended ? "studio-package--recommended" : ""}" data-package-id="${esc(pkg.id)}" data-pano-tilt="7">
          <div class="studio-package__glow" aria-hidden="true"></div>
          <header class="studio-package__header">
            <div class="studio-package__identity">
              <span class="studio-package__icon studio-package__icon--${esc(pkg.id)}">${icon}</span>
              <div class="studio-package__intro">
                <div class="studio-package__title-row">
                  <h3 class="studio-package__name">${esc(pkg.name)}</h3>
                  ${badge}
                </div>
                <p class="studio-package__tagline">${esc(pkg.tagline)}</p>
              </div>
            </div>
            <p class="studio-package__meta">${pkg.features.length} deliverables included</p>
          </header>
          <ul class="studio-package__features" role="list">
            ${featureItems}
          </ul>
          <footer class="studio-package__footer">
            <div class="studio-package__price">
              <span class="studio-package__price-label">Starting at</span>
              <p class="studio-package__price-row">
                <span class="studio-package__amount">${esc(pkg.price)}</span>
                <span class="studio-package__currency">${esc(pkg.currency)}</span>
              </p>
            </div>
            <a class="studio-package__cta btn btn-ghost" href="#studio-contact" data-magnetic>Enquire</a>
          </footer>
        </article>`;
}

function renderStudioFinale(studio: ChaosStudio): string {
  const sc = studio.studioContact;
  return `
      <section class="studio-finale" id="studio-contact" aria-labelledby="studio-finale-cta">
        <div class="studio-finale__wash" aria-hidden="true"></div>
        <div class="studio-finale__inner" data-reveal>
          <h2 class="studio-finale__cta" id="studio-finale-cta">Let's create something bold!</h2>
          <ul class="studio-finale__links">
            <li><a href="${esc(sc.instagramUrl)}" target="_blank" rel="noopener noreferrer">${esc(sc.instagram)}</a></li>
            <li><a href="tel:${esc(sc.phones.replace(/\s/g, "").replace(/\//g, ","))}">${esc(sc.phones)}</a></li>
            <li><a href="mailto:${esc(sc.email)}">${esc(sc.email)}</a></li>
          </ul>
        </div>
      </section>`;
}

function renderStudioContent(studio: ChaosStudio, opts?: { omitHero?: boolean }): string {
  const services = renderStudioServicePills(studio.services);
  const whyUs = studio.whyUs
    .map(
      (w) => `
        <article class="studio-why">
          <h4>${esc(w.title)}</h4>
          <p>${esc(w.body)}</p>
        </article>`,
    )
    .join("");
  const packages = studio.packages.map((pkg) => renderStudioPackage(pkg)).join("");
  const hero = opts?.omitHero
    ? ""
    : `
        <div class="studio-hero" data-reveal>
          <p class="eyebrow">${esc(studio.tagline)}</p>
          <h2 class="studio-hero__title">${esc(studio.headline)}</h2>
          <p class="studio-hero__pitch lead">${esc(studio.pitch)}</p>
        </div>`;
  const servicesBlock = opts?.omitHero
    ? ""
    : `
        <div class="studio-services" data-reveal aria-label="Services offered">
          ${services}
        </div>`;
  return `
        ${hero}
        ${servicesBlock}
        <div class="studio-why-grid" data-reveal>
          <div class="studio-why-label" aria-hidden="true">Why us?</div>
          ${whyUs}
        </div>
        <div class="glass-card studio-about" data-reveal>
          <h3 class="studio-about__title">${esc(studio.title)}</h3>
          <p class="lead">${esc(studio.description)}</p>
          <ul class="bullet-list">${studio.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
        </div>
        <div class="studio-pricing" id="packages" data-reveal>
          <div class="section-head section-head--compact">
            <p class="eyebrow">Packages & pricing</p>
            <h3>Service packages</h3>
            <p class="studio-pricing__note">${esc(studio.pricingNote)}</p>
          </div>
          <div class="studio-packages">${packages}</div>
        </div>`;
}

import { renderPostsSection } from "./components/social-post";
