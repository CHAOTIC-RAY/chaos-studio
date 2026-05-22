import type { Portfolio } from "./types/portfolio";
import { CHAOS_LOGO_SVG } from "./brand/logo";
import {
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
import { renderWorkMarquee } from "./render-work-marquee";

type DeviceMedia = { image: string; frames?: string[] };

const frame = (dir: string, names: string[]) =>
  names.map((n) => `/images/projects/frames/${dir}/${n}`);

const COOKXPERT_DESKTOP_FRAMES = frame("cookxpert/desktop", [
  "01-discover-dark.png",
  "02-discover-light.png",
  "03-library.png",
  "04-notifications.png",
  "05-settings-appearance-dark.png",
  "06-settings-appearance-light.png",
  "07-settings-membership.png",
  "08-fridge.png",
  "09-recipe-detail.png",
]);

const COOKXPERT_MOBILE_FRAMES = frame("cookxpert/mobile", [
  "01-discover-dark.png",
  "02-discover-light.png",
  "03-library.png",
  "04-notifications.png",
  "05-settings-appearance-dark.png",
  "06-settings-appearance-light.png",
  "07-settings-membership.png",
  "08-fridge.png",
]);

const FORGE_DESKTOP_FRAMES = frame("forge/desktop", [
  "01-profile.png",
  "02-dashboard.png",
  "03-calendar.png",
  "04-scheduling.png",
  "05-ideas.png",
  "06-idea-board.png",
  "07-hook-generator.png",
  "08-trends.png",
]);

const FORGE_MOBILE_FRAMES = frame("forge/mobile", [
  "01-profile.png",
  "02-dashboard.png",
  "03-scheduling.png",
]);

const FAISA_FRAMES = [
  "/images/projects/frames/faisa/01-splash.png",
  "/images/projects/frames/faisa/02-home.png",
  "/images/projects/frames/faisa/03-budget.png",
  "/images/projects/frames/faisa/04-services.png",
  "/images/projects/frames/faisa/05-wallet.png",
  "/images/projects/frames/faisa/06-transfer.png",
  "/images/projects/frames/faisa/07-receipt.png",
  "/images/projects/frames/faisa/08-cards.png",
  "/images/projects/frames/faisa/09-settings.png",
];

const PROJECT_MEDIA: Record<string, { desktop?: DeviceMedia; mobile?: DeviceMedia }> = {
  cookxpert: {
    desktop: { image: "/images/projects/cookxpert_desktop.png", frames: COOKXPERT_DESKTOP_FRAMES },
    mobile: { image: "/images/projects/cookxpert_mobile.png", frames: COOKXPERT_MOBILE_FRAMES },
  },
  forge: {
    desktop: { image: "/images/projects/forge_desktop.png", frames: FORGE_DESKTOP_FRAMES },
    mobile: { image: "/images/projects/forge_mobile.png", frames: FORGE_MOBILE_FRAMES },
  },
  faisa: {
    mobile: { image: "/images/projects/faisa_mobile.png", frames: FAISA_FRAMES },
  },
};

const PROJECT_LIVE_URL: Record<string, string> = {
  cookxpert: "cookxpert.chaoticstudio.workers.dev",
  forge: "forge.chaoticstudio.workers.dev",
  faisa: "Adobe XD prototype",
};

const PROJECT_LOGOS: Record<string, string> = {
  cookxpert: "/images/projects/logos/cookxpert.png",
  forge: "/images/projects/logos/forge.png",
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

      <section id="studio" class="section section--studio">
        ${renderStudioSection(p.chaosStudio)}
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

type SocialPost = Portfolio["socialPosts"]["items"][0];
type ChaosStudio = Portfolio["chaosStudio"];

function renderStudioSection(studio: ChaosStudio): string {
  const services = studio.services
    .map((s) => `<span class="studio-service">${esc(s)}</span>`)
    .join("");
  const whyUs = studio.whyUs
    .map(
      (w) => `
        <article class="studio-why">
          <h4>${esc(w.title)}</h4>
          <p>${esc(w.body)}</p>
        </article>`,
    )
    .join("");
  const packages = studio.packages
    .map(
      (pkg) => `
        <article class="studio-package ${pkg.recommended ? "studio-package--recommended" : ""}">
          ${pkg.recommended ? `<span class="studio-package__badge">Recommended</span>` : ""}
          <h3 class="studio-package__name">${esc(pkg.name)}</h3>
          <p class="studio-package__tagline">${esc(pkg.tagline)}</p>
          <ul class="studio-package__features">
            ${pkg.features.map((f) => `<li>${esc(f)}</li>`).join("")}
          </ul>
          <p class="studio-package__price"><span class="studio-package__amount">${esc(pkg.price)}</span> <span class="studio-package__currency">${esc(pkg.currency)}</span></p>
        </article>`,
    )
    .join("");
  const sc = studio.studioContact;
  return `
        <div class="studio-hero" data-reveal>
          <p class="eyebrow">${esc(studio.tagline)}</p>
          <h2 class="studio-hero__title">${esc(studio.headline)}</h2>
          <p class="studio-hero__pitch lead">${esc(studio.pitch)}</p>
        </div>
        <div class="studio-services" data-reveal aria-label="Services offered">
          ${services}
        </div>
        <div class="studio-why-grid" data-reveal>
          <div class="studio-why-label" aria-hidden="true">Why us?</div>
          ${whyUs}
        </div>
        <div class="glass-card studio-about" data-reveal>
          <h3 class="studio-about__title">${esc(studio.title)}</h3>
          <p class="lead">${esc(studio.description)}</p>
          <ul class="bullet-list">${studio.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
        </div>
        <div class="studio-pricing" data-reveal>
          <div class="section-head section-head--compact">
            <p class="eyebrow">Packages & pricing</p>
            <h3>Service packages</h3>
            <p class="studio-pricing__note">${esc(studio.pricingNote)}</p>
          </div>
          <div class="studio-packages">${packages}</div>
        </div>
        <div class="studio-contact glass-card" data-reveal>
          <p class="studio-contact__cta">Let's create something bold!</p>
          <ul class="studio-contact__links">
            <li><a href="${esc(sc.instagramUrl)}" target="_blank" rel="noopener noreferrer">${esc(sc.instagram)}</a></li>
            <li><a href="tel:${esc(sc.phones.replace(/\s/g, "").replace(/\//g, ","))}">${esc(sc.phones)}</a></li>
            <li><a href="mailto:${esc(sc.email)}">${esc(sc.email)}</a></li>
          </ul>
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
            class="btn btn-sm posts-panel__toggle"
            data-posts-expand
            aria-expanded="false"
            aria-controls="posts-panel"
          >
            <span class="posts-panel__toggle-label">Expand full feed</span>
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
            <p class="posts-rail__hint">Use arrows or drag · Hover reels to preview · Expand for full grid</p>
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
  return groups
    .map(
      (g, i) => `
      <details class="posts-accordion" ${i === 0 ? "open" : ""}>
        <summary class="posts-accordion__summary">
          <span class="posts-accordion__name">${esc(g.client)}</span>
          <span class="posts-accordion__count">${g.posts.length} post${g.posts.length === 1 ? "" : "s"}</span>
          <span class="posts-accordion__icon" aria-hidden="true">${ICON_CHEVRON_DOWN}</span>
        </summary>
        <div class="posts-accordion__body">
          <div class="posts-grid">
            ${g.posts.map((post) => renderPostCard(post, { expandable: true })).join("")}
          </div>
        </div>
      </details>`,
    )
    .join("");
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
          loop
          playsinline
          preload="metadata"
          aria-label="${esc(post.title)}"
        ></video>`;
}

function renderPostSlideImg(
  post: SocialPost,
  slide: string,
  opts: { slideIndex: number; slideCount: number; eager?: boolean },
): string {
  const src = postSlideSrc(post, slide);
  const imageBase = post.slides?.length ? `${post.id}/${slide}` : postImageBase(post);
  return `
        <img
          class="post-card__img${opts.slideCount > 1 ? " post-card__slide" : ""}"
          data-post-id="${esc(post.id)}"
          data-image-base="${esc(imageBase)}"
          src="${esc(src)}"
          alt="${esc(post.title)} — ${esc(post.client)}${opts.slideCount > 1 ? ` (${opts.slideIndex + 1}/${opts.slideCount})` : ""}"
          width="400"
          height="500"
          loading="${opts.eager ? "eager" : "lazy"}"
          ${opts.slideCount > 1 ? `style="--slide-i:${opts.slideIndex};--slide-count:${opts.slideCount}"` : ""}
        />`;
}

function renderPostMedia(post: SocialPost): string {
  if (post.video) {
    return `${renderPostVideo(post)}
        <span class="post-card__play" aria-hidden="true"></span>`;
  }

  const slides =
    post.slides?.length && post.slides.length > 0
      ? post.slides
      : [postImageBase(post)];

  if (slides.length === 1) {
    return renderPostSlideImg(post, slides[0], { slideIndex: 0, slideCount: 1, eager: false });
  }

  const count = slides.length;
  const imgs = slides
    .map((slide, i) => renderPostSlideImg(post, slide, { slideIndex: i, slideCount: count, eager: i === 0 }))
    .join("");
  return `
    <div class="post-card__carousel post-card__carousel--${count}" aria-label="${esc(post.title)} carousel">
      ${imgs}
      <span class="post-card__slides-badge" aria-hidden="true">${count} slides</span>
    </div>`;
}

function renderPostCard(post: SocialPost, opts?: { expandable?: boolean }): string {
  const accent = POST_ACCENTS[post.accent] ?? "post-card--purple";
  const kind = post.video ? "post-card--video" : post.slides && post.slides.length > 1 ? "post-card--carousel" : "";
  const slideCount = post.slides?.length ?? 0;
  const expandable = opts?.expandable ?? false;
  return `
    <article class="post-card ${accent} ${kind}${expandable ? " post-card--expandable" : ""}" data-post-kind="${post.video ? "video" : slideCount > 1 ? "carousel" : "image"}">
      <div class="post-card__media">
        ${renderPostMedia(post)}
        <div class="post-card__shine" aria-hidden="true"></div>
      </div>
      <div class="post-card__body">
        <p class="post-card__client">${esc(post.client)}</p>
        <h3>${esc(post.title)}</h3>
        <p class="post-desc">${esc(post.description)}</p>
        <div class="post-tags">${post.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        ${
          expandable
            ? `<button type="button" class="post-card__more" aria-expanded="false">Show more</button>`
            : ""
        }
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
  const logoMark = logo
    ? `<img class="work-showcase__logo-mark" src="${logo}" alt="" width="160" height="160" loading="lazy" aria-hidden="true" />`
    : "";

  const devices: string[] = [];
  if (media.desktop) devices.push(renderBrowserFrame(media.desktop, proj.name, liveUrl, proj.href, logo));
  if (media.mobile) devices.push(renderPhoneFrame(media.mobile, proj.name, logo));

  const deviceBlock =
    devices.length > 0
      ? `<div class="work-showcase__devices ${devices.length > 1 ? "work-showcase__devices--dual" : "work-showcase__devices--solo"}" data-tilt-showcase>
          ${logoMark}
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
