import type { Portfolio } from "./types/portfolio";
import { CHAOS_LOGO_SVG, CHAOS_LOGO_SVG_HERO } from "./brand/logo";
import { portfolioUrl, studioUrl } from "./router";
import {
  ICON_CHECK,
  ICON_CHEVRON_DOWN,
  ICON_CHEVRON_LEFT,
  ICON_CHEVRON_RIGHT,
  ICON_CLOSE,
  ICON_MENU,
  ICON_MOON,
  ICON_PRINT,
  ICON_SUN,
  ICON_TELEGRAM,
} from "./icons";
import { renderToolTag } from "./skill-icons";
import { studioPackageIcon } from "./studio-package-icons";
import { renderWorkMarquee } from "./render-work-marquee";

type DeviceMedia = { image: string; frames?: string[] };

const frame = (dir: string, names: string[]) =>
  names.map((n) => `/images/projects/frames/${dir}/${n}`);

const COOKXPERT_DESKTOP_FRAMES = frame("cookxpert/desktop", [
  "01-discover-dark.webp",
  "02-discover-light.webp",
  "03-library.webp",
  "04-notifications.webp",
  "05-settings-appearance-dark.webp",
  "06-settings-appearance-light.webp",
  "07-settings-membership.webp",
  "08-fridge.webp",
  "09-recipe-detail.webp",
]);

const COOKXPERT_MOBILE_FRAMES = frame("cookxpert/mobile", [
  "01-discover-dark.webp",
  "02-discover-light.webp",
  "03-library.webp",
  "04-notifications.webp",
  "05-settings-appearance-dark.webp",
  "06-settings-appearance-light.webp",
  "07-settings-membership.webp",
  "08-fridge.webp",
]);

const FORGE_DESKTOP_FRAMES = frame("forge/desktop", [
  "01-profile.webp",
  "02-dashboard.webp",
  "03-calendar.webp",
  "04-scheduling.webp",
  "05-ideas.webp",
  "06-idea-board.webp",
  "07-hook-generator.webp",
  "08-trends.webp",
]);

const FORGE_MOBILE_FRAMES = frame("forge/mobile", [
  "01-profile.webp",
  "02-dashboard.webp",
  "03-scheduling.webp",
]);

/** MIB prototype flow: splash → home → services → analytics → wallet → transfer → receipt → create account → settings */
const FAISA_FRAMES = [
  "/images/projects/frames/faisa/01-splash.webp",
  "/images/projects/frames/faisa/02-home.webp",
  "/images/projects/frames/faisa/04-services.webp",
  "/images/projects/frames/faisa/03-budget.webp",
  "/images/projects/frames/faisa/05-wallet.webp",
  "/images/projects/frames/faisa/06-transfer.webp",
  "/images/projects/frames/faisa/07-receipt.webp",
  "/images/projects/frames/faisa/08-create-account.webp",
  "/images/projects/frames/faisa/09-settings.webp",
];

const PROJECT_MEDIA: Record<string, { desktop?: DeviceMedia; mobile?: DeviceMedia }> = {
  cookxpert: {
    desktop: { image: "/images/projects/cookxpert_desktop.webp", frames: COOKXPERT_DESKTOP_FRAMES },
    mobile: { image: "/images/projects/cookxpert_mobile.webp", frames: COOKXPERT_MOBILE_FRAMES },
  },
  forge: {
    desktop: { image: "/images/projects/forge_desktop.webp", frames: FORGE_DESKTOP_FRAMES },
    mobile: { image: "/images/projects/forge_mobile.webp", frames: FORGE_MOBILE_FRAMES },
  },
  faisa: {
    mobile: { image: "/images/projects/faisa_mobile.webp", frames: FAISA_FRAMES },
  },
};

const PROJECT_LIVE_URL: Record<string, string> = {
  cookxpert: "cookxpert.chaoticstudio.workers.dev",
  forge: "forge.chaoticstudio.workers.dev",
  faisa: "Adobe XD prototype",
};

const PROJECT_LOGOS: Record<string, string> = {
  cookxpert: "/images/projects/logos/cookxpert.webp",
  forge: "/images/projects/logos/forge.webp",
};

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
  { href: studioUrl(), label: "Studio", route: true },
  { href: "#contact", label: "Contact" },
];

const STUDIO_NAV: NavItem[] = [
  { href: portfolioUrl(), label: "Portfolio", route: true },
  { href: "#packages", label: "Packages" },
  { href: "#studio-contact", label: "Contact" },
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
      <nav class="nav nav--desktop" aria-label="Primary">
        ${renderNavLinks(opts.nav)}
      </nav>
      <div class="header-actions">
        <button type="button" class="btn-icon theme-toggle" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode">
          <span class="theme-toggle__sun">${ICON_SUN}</span>
          <span class="theme-toggle__moon">${ICON_MOON}</span>
        </button>
        ${printBtn}
        <a class="nav-cta" href="${ctaHref}"${ctaExternal}>${ctaLabel}</a>
      </div>
    </header>
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

      <section id="posts" class="section section--posts">
        ${renderPostsSection(p.socialPosts)}
      </section>

      <section id="work" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Featured work</p>
          <h2>${esc(p.featuredWork.subtitle)}</h2>
        </div>
        <div class="work-stack">
          ${p.featuredWork.projects.map((proj, i) => renderProject(proj, i)).join("")}
        </div>
      </section>

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
          <a class="studio-page-back" href="${portfolioUrl()}" data-route-link>
            ${ICON_CHEVRON_LEFT}
            <span>Back to portfolio</span>
          </a>
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
      </div>
      ${renderStudioFinale(studio)}
    </main>
    <footer class="site-footer site-footer--studio">
      <p>© ${new Date().getFullYear()} ${esc(studio.title)} · Malé, Maldives</p>
    </footer>
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
        <article class="studio-package ${pkg.recommended ? "studio-package--recommended" : ""}" data-package-id="${esc(pkg.id)}">
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

function visiblePosts(items: SocialPost[]): SocialPost[] {
  return items.filter((post) => !post.id.startsWith("_"));
}

function renderPostsSection(social: Portfolio["socialPosts"]): string {
  const items = visiblePosts(social.items);
  const count = items.length;
  return `
        <div class="section-head section-head--posts" data-reveal>
          <div class="section-head__copy">
            <p class="eyebrow">Campaign & feed</p>
            <h2>${esc(social.subtitle)}</h2>
          </div>
          <button
            type="button"
            class="posts-panel__toggle"
            data-posts-expand
            aria-expanded="false"
            aria-controls="posts-panel"
          >
            <span class="posts-panel__toggle-label">Browse full feed</span>
            <span class="posts-panel__toggle-meta">${count} posts</span>
            <span class="posts-panel__toggle-icon" aria-hidden="true">${ICON_CHEVRON_DOWN}</span>
          </button>
        </div>
        <div class="posts-panel posts-panel--collapsed" id="posts-panel" data-posts-panel data-reveal>
          <div class="posts-rail" data-posts-carousel>
            <div class="posts-rail__shell">
              <button type="button" class="posts-rail__btn posts-rail__btn--prev" aria-label="Previous campaign posts">
                ${ICON_CHEVRON_LEFT}
              </button>
              <div class="posts-viewport" tabindex="0" aria-label="Campaign and feed posts carousel">
                <div class="posts-track">
                  ${renderPostsTrack(items)}
                </div>
              </div>
              <button type="button" class="posts-rail__btn posts-rail__btn--next" aria-label="Next campaign posts">
                ${ICON_CHEVRON_RIGHT}
              </button>
            </div>
            <p class="posts-rail__hint">Auto-scrolls smoothly · drag or use arrows · expand for full grid</p>
          </div>
          <div class="posts-feed-expanded" data-posts-expanded hidden>
            ${renderPostsExpandedFeed(items)}
          </div>
        </div>`;
}

function groupPostsByClient(items: SocialPost[]): { client: string; posts: SocialPost[] }[] {
  const groups: { client: string; posts: SocialPost[] }[] = [];
  for (const post of items) {
    const last = groups[groups.length - 1];
    if (last?.client === post.client) last.posts.push(post);
    else groups.push({ client: post.client, posts: [post] });
  }
  return groups;
}

function clientSlug(client: string): string {
  return client
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function postCardLayout(post: SocialPost): "poster" | "media-kit" | null {
  if (post.cardLayout === "poster" || post.cardLayout === "media-kit") return post.cardLayout;
  if (post.id.includes("poster") || post.tags.some((t) => /poster/i.test(t))) return "poster";
  if (
    post.platform === "Media kit" ||
    post.tags.some((t) => /media\s*kit/i.test(t)) ||
    (post.slides && post.slides.length >= 4 && post.mediaAspect === "landscape")
  ) {
    return "media-kit";
  }
  return null;
}

function postKindLabel(post: SocialPost): string {
  if (post.video) return "Reel";
  if (postCardLayout(post) === "poster") return "Poster";
  if (postCardLayout(post) === "media-kit") {
    const n = post.slides?.length ?? 0;
    return n > 0 ? `Media kit · ${n} pages` : "Media kit";
  }
  const n = post.slides?.length ?? 0;
  if (n > 1) return `${n} slides`;
  return "Image";
}

function renderPostsTrack(items: SocialPost[]): string {
  const groups = groupPostsByClient(items);
  const renderGroups = () =>
    groups
      .map(
        (g) => `
      <div class="posts-group">
        <div class="posts-group__head">
          <span class="posts-group__name">${esc(g.client)}</span>
          <span class="posts-group__count">${g.posts.length}</span>
        </div>
        <div class="posts-group__cards">
          ${g.posts.map((post) => renderPostCard(post)).join("")}
        </div>
      </div>`,
      )
      .join("");
  return renderGroups() + renderGroups();
}

function renderPostsExpandedFeed(items: SocialPost[]): string {
  const groups = groupPostsByClient(items);
  const clientCount = groups.length;
  const tabs = groups
    .map(
      (g, i) => `
        <button
          type="button"
          role="tab"
          class="posts-feed__tab${i === 0 ? " posts-feed__tab--active" : ""}"
          data-posts-tab="${esc(clientSlug(g.client))}"
          aria-selected="${i === 0 ? "true" : "false"}"
          aria-controls="posts-panel-${esc(clientSlug(g.client))}"
          id="posts-tab-${esc(clientSlug(g.client))}"
        >
          <span class="posts-feed__tab-label">${esc(g.client)}</span>
          <span class="posts-feed__tab-count">${g.posts.length}</span>
        </button>`,
    )
    .join("");

  const panels = groups
    .map(
      (g, i) => `
      <section
        class="posts-feed__panel${i === 0 ? " posts-feed__panel--active" : ""}"
        id="posts-panel-${esc(clientSlug(g.client))}"
        role="tabpanel"
        data-posts-tab-panel="${esc(clientSlug(g.client))}"
        data-client="${esc(g.client)}"
        aria-labelledby="posts-tab-${esc(clientSlug(g.client))}"
        ${i === 0 ? "" : "hidden"}
      >
        <p class="posts-feed__panel-intro">${g.posts.length} post${g.posts.length === 1 ? "" : "s"} · Swipe multi-slide decks sideways · Tap any frame for fullscreen</p>
        <div class="posts-feed__grid">
          ${g.posts.map((post) => renderPostCard(post, { feed: "expanded" })).join("")}
        </div>
      </section>`,
    )
    .join("");

  return `
    <div class="posts-feed__shell">
      <header class="posts-feed__toolbar" data-posts-toolbar>
        <div class="posts-feed__toolbar-copy">
          <p class="posts-feed__eyebrow">Campaign archive</p>
          <p class="posts-feed__lead">${items.length} posts · ${clientCount} client${clientCount === 1 ? "" : "s"}</p>
        </div>
        <div class="posts-feed__tabs-wrap" data-posts-tabs-wrap>
          <button type="button" class="posts-feed__tabs-scroll posts-feed__tabs-scroll--prev" data-posts-tabs-prev aria-label="Scroll clients left">
            ${ICON_CHEVRON_LEFT}
          </button>
          <div class="posts-feed__tabs hide-scrollbar" data-posts-tabs role="tablist" aria-label="Filter by client">${tabs}</div>
          <button type="button" class="posts-feed__tabs-scroll posts-feed__tabs-scroll--next" data-posts-tabs-next aria-label="Scroll clients right">
            ${ICON_CHEVRON_RIGHT}
          </button>
        </div>
      </header>
      <div class="posts-feed__panels">${panels}</div>
    </div>`;
}

function postImageBase(post: SocialPost): string {
  return post.image?.trim() || post.id;
}

function postSlideSrc(post: Portfolio["socialPosts"]["items"][0], slide: string): string {
  if (post.slides?.length) {
    return `/images/posts/${post.id}/${slide}.webp`;
  }
  const base = postImageBase(post);
  return `/images/posts/${base}.webp`;
}

function renderPostVideo(post: SocialPost): string {
  const dir = `/images/posts/${post.id}`;
  const videoSrc = `${dir}/${post.video}`;
  const posterSrc = `${dir}/${post.poster ?? "poster.webp"}`;
  return `
        <video
          class="post-card__video"
          data-post-id="${esc(post.id)}"
          src="${esc(videoSrc)}"
          poster="${esc(posterSrc)}"
          muted
          autoplay
          loop
          playsinline
          preload="metadata"
          aria-label="${esc(post.title)}"
        ></video>
        <button type="button" class="post-card__unmute" aria-pressed="true" aria-label="Unmute ${esc(post.title)}">Unmute</button>`;
}

function renderPostViewButton(post: SocialPost): string {
  const label = post.video ? `Play ${post.title} full screen` : `View ${post.title} full screen`;
  return `<button type="button" class="post-card__view" data-post-view aria-label="${esc(label)}"></button>`;
}

function postMediaAspect(post: SocialPost): "portrait" | "landscape" | "square" {
  return post.mediaAspect ?? "portrait";
}

function postSlideDimensions(post: SocialPost): { width: number; height: number } {
  switch (postMediaAspect(post)) {
    case "landscape":
      return { width: 841, height: 596 };
    case "square":
      return { width: 1080, height: 1080 };
    default:
      return { width: 1080, height: 1350 };
  }
}

function postAspectClass(post: SocialPost): string {
  const aspect = postMediaAspect(post);
  if (aspect === "landscape") return "post-card--landscape";
  if (aspect === "square") return "post-card--square";
  return "";
}

function renderPostSlideImg(
  post: SocialPost,
  slide: string,
  opts: { slideIndex: number; slideCount: number; eager?: boolean; filmstrip?: boolean },
): string {
  const src = postSlideSrc(post, slide);
  const imageBase = post.slides?.length ? `${post.id}/${slide}` : postImageBase(post);
  const { width, height } = postSlideDimensions(post);
  const slideClass = opts.slideCount > 1 && !opts.filmstrip ? " post-card__slide" : "";
  return `
        <img
          class="post-card__img${slideClass}"
          data-post-id="${esc(post.id)}"
          data-image-base="${esc(imageBase)}"
          src="${esc(src)}"
          alt="${esc(post.title)} — ${esc(post.client)}${opts.slideCount > 1 ? ` (${opts.slideIndex + 1}/${opts.slideCount})` : ""}"
          width="${width}"
          height="${height}"
          loading="${opts.eager ? "eager" : "lazy"}"
          ${opts.slideCount > 1 && !opts.filmstrip ? `style="--slide-i:${opts.slideIndex};--slide-count:${opts.slideCount}"` : ""}
        />`;
}

function renderPostPosterFull(post: SocialPost): string {
  const slide = postImageBase(post);
  return `
    <div class="post-card__poster-full">
      ${renderPostSlideImg(post, slide, { slideIndex: 0, slideCount: 1, eager: true })}
    </div>
    ${renderPostViewButton(post)}`;
}

function renderSlideCounter(current: number, total: number): string {
  return `<span class="post-card__slide-counter" data-slide-counter aria-hidden="true">${current} / ${total}</span>`;
}

function renderPostMediaKitGrid(post: SocialPost, slides: string[]): string {
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

function renderPostFilmstrip(post: SocialPost, slides: string[]): string {
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

function renderPostMedia(post: SocialPost, mode: "rail" | "expanded" = "rail"): string {
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

function renderPostCard(post: SocialPost, opts?: { feed?: "rail" | "expanded" }): string {
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

function renderProjectHead(proj: Portfolio["featuredWork"]["projects"][0], featured: boolean): string {
  const label = featured ? "Featured product" : "Web & mobile";
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

function renderProject(proj: Portfolio["featuredWork"]["projects"][0], index: number): string {
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
  const deviceBlock =
    devices.length > 0
      ? `<div class="work-showcase__devices ${devices.length > 1 ? "work-showcase__devices--dual" : "work-showcase__devices--solo"}" data-tilt-showcase>
          ${deviceInner}
        </div>`
      : `<div class="work-showcase__devices work-showcase__devices--placeholder"><span>${esc(proj.name)}</span></div>`;

  const highlights = proj.highlights
    ? `<ul class="work-showcase__highlights">${proj.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
    : "";

  const tags = proj.tags
    ? `<div class="work-showcase__tags">${proj.tags.slice(0, 6).map((t) => `<span>${esc(t)}</span>`).join("")}</div>`
    : "";

  return `
    <article class="work-showcase work-showcase--${esc(proj.id)} ${featured ? "work-showcase--featured" : ""}" data-reveal id="project-${esc(proj.id)}">
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
