import type { Portfolio } from "./types/portfolio";
import { CHAOS_LOGO_SVG } from "./brand/logo";
import { ICON_CLOSE, ICON_MENU, ICON_MOON, ICON_PRINT, ICON_SUN, ICON_TELEGRAM } from "./icons";
import { renderToolTag } from "./skill-icons";
import { renderWorkMarquee } from "./render-work-marquee";

type DeviceMedia = { image: string; frames?: string[] };

const COOKXPERT_FRAMES = [
  "/images/projects/frames/cookxpert/01-discover.png",
  "/images/projects/frames/cookxpert/02-library.png",
  "/images/projects/frames/cookxpert/02-fridge.png",
  "/images/projects/frames/cookxpert/02-home.png",
];

const FAISA_FRAMES = [
  "/images/projects/frames/faisa/01-dashboard.png",
  "/images/projects/frames/faisa/02-overview.png",
  "/images/projects/frames/faisa/03-cards.png",
  "/images/projects/frames/faisa/04-transfer.png",
  "/images/projects/frames/faisa/05-bills.png",
  "/images/projects/frames/faisa/06-detail.png",
  "/images/projects/frames/faisa/07-profile.png",
];

const PROJECT_MEDIA: Record<string, { desktop?: DeviceMedia; mobile?: DeviceMedia }> = {
  cookxpert: {
    desktop: { image: "/images/projects/cookxpert_desktop.png", frames: COOKXPERT_FRAMES },
    mobile: { image: "/images/projects/cookxpert_mobile.png", frames: COOKXPERT_FRAMES },
  },
  forge: {
    desktop: { image: "/images/projects/forge_desktop.png" },
    mobile: { image: "/images/projects/forge_mobile.png" },
  },
  faisa: {
    mobile: { image: "/images/projects/frames/faisa/01-dashboard.png", frames: FAISA_FRAMES },
  },
};

const PROJECT_LIVE_URL: Record<string, string> = {
  cookxpert: "cookxpert.chaoticstudio.workers.dev",
  forge: "forge.chaoticstudio.workers.dev",
  faisa: "Adobe XD prototype",
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

export function renderPage(p: Portfolio): string {
  const nav = [
    { id: "about", label: "About" },
    { id: "experience", label: "Experience" },
    { id: "posts", label: "Posts" },
    { id: "work", label: "Work" },
    { id: "skills", label: "Skills" },
    { id: "studio", label: "Studio" },
    { id: "contact", label: "Contact" },
  ];

  return `
    <div class="bg-layers" aria-hidden="true">
      <canvas id="bg-canvas"></canvas>
      <div class="bg-blobs"></div>
      <div class="bg-dither" aria-hidden="true"></div>
      <div class="bg-grain"></div>
      <div class="hero-orb" data-parallax="24" aria-hidden="true"></div>
    </div>
    <div class="scroll-progress" aria-hidden="true"></div>
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="site-header">
      <a class="logo" href="#top">
        ${CHAOS_LOGO_SVG}
        <span class="logo-text">${esc(p.profile.name)}</span>
      </a>
      <nav class="nav nav--desktop" aria-label="Primary">
        ${nav.map((l) => `<a class="nav__link" href="#${l.id}">${l.label}</a>`).join("")}
      </nav>
      <div class="header-actions">
        <button type="button" class="btn-icon theme-toggle" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode">
          <span class="theme-toggle__sun">${ICON_SUN}</span>
          <span class="theme-toggle__moon">${ICON_MOON}</span>
        </button>
        <button type="button" class="btn-icon btn-print" id="print-portfolio" aria-label="Print or save portfolio as PDF">
          ${ICON_PRINT}
        </button>
        <a class="nav-cta" href="${esc(p.contact.telegramUrl)}" target="_blank" rel="noopener noreferrer">Contact</a>
      </div>
    </header>
    <button type="button" class="nav-toggle nav-toggle--fab" id="nav-toggle" aria-expanded="false" aria-controls="nav-drawer" aria-label="Open menu">
      <span class="nav-toggle__open">${ICON_MENU}</span>
      <span class="nav-toggle__close">${ICON_CLOSE}</span>
    </button>
    <div class="nav-drawer" id="nav-drawer" hidden>
      <div class="nav-drawer__backdrop" data-nav-close tabindex="-1" aria-hidden="true"></div>
      <nav class="nav nav--mobile" aria-label="Mobile">
        ${nav.map((l) => `<a class="nav__link" href="#${l.id}">${l.label}</a>`).join("")}
        <a class="nav-cta nav-cta--block" href="${esc(p.contact.telegramUrl)}" target="_blank" rel="noopener noreferrer">Contact</a>
      </nav>
    </div>

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
        <div class="section-head" data-reveal>
          <p class="eyebrow">Campaign & feed</p>
          <h2>${esc(p.socialPosts.subtitle)}</h2>
        </div>
        <div class="posts-viewport" data-reveal>
          <div class="posts-track">
            ${[...p.socialPosts.items, ...p.socialPosts.items].map((post) => renderPostCard(post)).join("")}
          </div>
        </div>
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

      <section id="studio" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">${esc(p.chaosStudio.tagline)}</p>
          <h2>${esc(p.chaosStudio.title)}</h2>
        </div>
        <div class="glass-card" data-reveal>
          <p class="lead">${esc(p.chaosStudio.description)}</p>
          <ul class="bullet-list">${p.chaosStudio.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
        </div>
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

function postImageBase(post: Portfolio["socialPosts"]["items"][0]): string {
  return post.image?.trim() || post.id;
}

function renderPostCard(post: Portfolio["socialPosts"]["items"][0]): string {
  const accent = POST_ACCENTS[post.accent] ?? "post-card--purple";
  const imageBase = postImageBase(post);
  return `
    <article class="post-card ${accent}">
      <div class="post-card__media">
        <img
          class="post-card__img"
          data-post-id="${esc(post.id)}"
          data-image-base="${esc(imageBase)}"
          src="/images/posts/${esc(imageBase)}.webp"
          alt="${esc(post.title)} — ${esc(post.client)}"
          width="400"
          height="500"
          loading="lazy"
        />
        <div class="post-card__shine" aria-hidden="true"></div>
      </div>
      <div class="post-card__body">
        <span class="post-platform">${esc(post.platform)}</span>
        <h3>${esc(post.title)}</h3>
        <p class="post-client">${esc(post.client)}</p>
        <p class="post-desc">${esc(post.description)}</p>
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

function renderBrowserFrame(media: DeviceMedia, label: string, liveUrl: string, siteHref: string): string {
  return `
    <div class="device device--browser" aria-label="${esc(label)} desktop preview">
      <div class="device__chrome">
        <span class="device__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <a class="device__url" href="${esc(siteHref)}" target="_blank" rel="noopener noreferrer">${esc(liveUrl)}</a>
      </div>
      <div class="device__screen">
        ${renderScreenMedia(media, label, "desktop")}
      </div>
    </div>
  `;
}

function renderPhoneFrame(media: DeviceMedia, label: string): string {
  return `
    <div class="device device--phone" aria-label="${esc(label)} mobile preview">
      <div class="device__bezel">
        <span class="device__notch" aria-hidden="true"></span>
        <div class="device__screen">
          ${renderScreenMedia(media, label, "mobile")}
        </div>
      </div>
    </div>
  `;
}

function renderProject(proj: Portfolio["featuredWork"]["projects"][0], index: number): string {
  const media = PROJECT_MEDIA[proj.id] ?? {};
  const liveUrl = PROJECT_LIVE_URL[proj.id] ?? proj.name;
  const featured = index === 0;

  const devices: string[] = [];
  if (media.desktop) devices.push(renderBrowserFrame(media.desktop, proj.name, liveUrl, proj.href));
  if (media.mobile) devices.push(renderPhoneFrame(media.mobile, proj.name));

  const deviceBlock =
    devices.length > 0
      ? `<div class="work-showcase__devices ${devices.length > 1 ? "work-showcase__devices--dual" : "work-showcase__devices--solo"}" data-tilt-showcase>
          ${devices.join("")}
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
          <span class="work-showcase__label">${featured ? "Featured product" : "Web & mobile"}</span>
          <h3>${esc(proj.name)}</h3>
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
