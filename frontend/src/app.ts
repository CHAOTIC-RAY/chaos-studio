import { fetchProfile } from "./api";
import { initCanvasBackground } from "./background/canvas-bg";
import { coverFallback, loadSiteConfig } from "./data/loadSite";
import { initInteractions } from "./interactions";
import { initHeaderScroll, initScrollAnimations } from "./motion/scroll";
import type { SiteConfig, WorkProject } from "./types/site";
import { submitContact } from "./api";

export async function initApp(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  let config: SiteConfig;
  try {
    config = await loadSiteConfig();
    applyMeta(config);
  } catch {
    app.innerHTML = `<p class="load-error">Could not load site config. Check /assets/site.config.json</p>`;
    return;
  }

  app.innerHTML = renderShell(config);

  const cleanups: (() => void)[] = [];
  cleanups.push(initCanvasBackground());
  cleanups.push(initScrollAnimations());
  cleanups.push(initHeaderScroll());
  cleanups.push(initInteractions());

  bindNavigation();
  bindContactForm();
  await loadProfile(config);

  window.addEventListener("beforeunload", () => cleanups.forEach((fn) => fn()));
}

function applyMeta(config: SiteConfig): void {
  document.title = config.meta.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", config.meta.description);

  let og = document.querySelector('meta[property="og:image"]');
  if (!og) {
    og = document.createElement("meta");
    og.setAttribute("property", "og:image");
    document.head.appendChild(og);
  }
  og.setAttribute("content", new URL(config.meta.ogImage, window.location.origin).href);
}

function renderShell(config: SiteConfig): string {
  const { brand, about, social, work, clients } = config;
  const fallback = coverFallback();

  return `
    <div class="bg-layers" aria-hidden="true">
      <canvas id="bg-canvas"></canvas>
      <div class="bg-blobs"></div>
      <div class="bg-grain"></div>
    </div>
    <div class="scroll-progress" aria-hidden="true"></div>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <a class="logo" href="#">
        <img class="logo-img" src="${esc(brand.logo)}" alt="${esc(brand.logoAlt)}" width="160" height="32" />
      </a>
      <nav class="nav" aria-label="Primary">
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
    <main id="main">
      <section class="hero" aria-labelledby="hero-title">
        <p class="hero-eyebrow eyebrow">Graphic Design</p>
        <h1 id="hero-title" class="hero-title">
          <span class="hero-line"><span id="profile-name">CHAOTIC-RAY</span></span>
          <span class="hero-line hero-line--accent">Visual stories</span>
        </h1>
        <p id="profile-tagline" class="hero-tagline">Loading…</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#work" data-magnetic>View work</a>
          <a class="btn btn-ghost" id="github-link" href="${esc(social.github)}" target="_blank" rel="noopener noreferrer" data-magnetic>GitHub</a>
        </div>
        <div class="scroll-cue" aria-hidden="true">
          <span>Scroll</span>
          <span class="scroll-cue-line"></span>
        </div>
      </section>

      <section id="work" class="section section--work">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Selected work</p>
          <h2>Projects</h2>
        </div>
        <ul class="project-grid">
          ${work.map((p) => renderProjectCard(p, fallback)).join("")}
        </ul>
      </section>

      ${
        clients.length
          ? `
      <section class="section section--clients" aria-label="Clients">
        <p class="eyebrow" data-reveal>Trusted by</p>
        <ul class="client-strip" data-reveal>
          ${clients
            .map(
              (c) => `
            <li><img src="${esc(c.logo)}" alt="${esc(c.logoAlt)}" width="120" height="40" loading="lazy" /></li>
          `,
            )
            .join("")}
        </ul>
      </section>`
          : ""
      }

      <section id="about" class="section section--about">
        <div class="about-grid">
          <div class="about-portrait-wrap" data-reveal>
            <img class="about-portrait" src="${esc(about.portrait)}" alt="${esc(about.portraitAlt)}" width="400" height="500" loading="lazy" />
          </div>
          <div class="about-copy" data-reveal>
            <p class="eyebrow">About</p>
            <h2>Design with intent</h2>
            <p class="lead">${esc(about.bio)}</p>
            <ul class="skill-chips">
              ${about.skills.map((s) => `<li>${esc(s)}</li>`).join("")}
            </ul>
            <div class="social-row">
              <a href="${esc(social.behance)}" target="_blank" rel="noopener noreferrer">Behance</a>
              <a href="${esc(social.dribbble)}" target="_blank" rel="noopener noreferrer">Dribbble</a>
              <a href="${esc(social.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
            <p id="api-status" class="api-status" role="status" aria-live="polite"></p>
          </div>
        </div>
      </section>

      <section id="contact" class="section section--contact">
        <div data-reveal>
          <p class="eyebrow">Contact</p>
          <h2>Let's create something</h2>
          <p class="lead">Available for freelance and collaborations.</p>
        </div>
        <form id="contact-form" class="contact-form" data-reveal novalidate>
          <label>
            <span>Name</span>
            <input name="name" type="text" required autocomplete="name" />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" required autocomplete="email" />
          </label>
          <label>
            <span>Message</span>
            <textarea name="message" rows="4" required></textarea>
          </label>
          <button type="submit" class="btn btn-primary" data-magnetic>Send message</button>
          <p id="form-feedback" class="form-feedback" role="status" aria-live="polite"></p>
        </form>
      </section>
    </main>
    <footer class="site-footer">
      <img class="footer-mark" src="${esc(brand.logoMark)}" alt="" width="32" height="32" />
      <p>© ${new Date().getFullYear()} ${esc(brand.logoAlt)} · Graphic design portfolio</p>
    </footer>
  `;
}

function renderProjectCard(p: WorkProject, fallback: string): string {
  const featured = p.featured ? " project-card--featured" : "";
  const hoverAttr = p.coverHover ? ` data-cover-hover="${esc(p.coverHover)}"` : "";
  return `
    <li class="project-card${featured}"${hoverAttr} data-reveal>
      <a class="project-card-link" href="${esc(p.href)}" target="_blank" rel="noopener noreferrer">
        <div class="project-media">
          <img
            class="project-cover"
            src="${esc(p.cover)}"
            alt="${esc(p.coverAlt)}"
            width="1200"
            height="900"
            loading="lazy"
            onerror="this.onerror=null;this.src='${fallback}'"
          />
        </div>
        <div class="project-overlay">
          <span class="project-category">${esc(p.category)}</span>
          <h3>${esc(p.title)}</h3>
          <span class="project-year">${esc(p.year)}</span>
          <span class="project-cta">View project →</span>
        </div>
      </a>
    </li>
  `;
}

function esc(text: string): string {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function bindNavigation(): void {
  document.querySelectorAll('.nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = (e.currentTarget as HTMLAnchorElement).getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  const progress = document.querySelector(".scroll-progress") as HTMLElement | null;
  if (progress) {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
}

async function loadProfile(config: SiteConfig): Promise<void> {
  const status = document.getElementById("api-status");
  const tagline = document.getElementById("profile-tagline");
  const nameEl = document.getElementById("profile-name");
  const github = document.getElementById("github-link") as HTMLAnchorElement | null;

  try {
    const profile = await fetchProfile();
    if (nameEl) nameEl.textContent = profile.name;
    if (tagline)
      tagline.textContent = `${profile.title} — ${profile.tagline}`;
    if (github) github.href = profile.links.github ?? config.social.github;
    if (status) {
      status.textContent = "";
      status.classList.add("ok");
    }
  } catch {
    if (tagline) tagline.textContent = "Brand identity · Editorial · Digital";
    if (status) status.textContent = "";
  }
}

function bindContactForm(): void {
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  const feedback = document.getElementById("form-feedback");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!feedback) return;

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !email || !message) {
      feedback.textContent = "Please fill in all fields.";
      feedback.className = "form-feedback error";
      return;
    }

    const button = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    button.disabled = true;
    feedback.textContent = "Sending…";
    feedback.className = "form-feedback";

    try {
      const result = await submitContact({ name, email, message });
      feedback.textContent = result.message;
      feedback.className = "form-feedback ok";
      form.reset();
    } catch (err) {
      feedback.textContent =
        err instanceof Error ? err.message : "Could not send. Try again later.";
      feedback.className = "form-feedback error";
    } finally {
      button.disabled = false;
    }
  });
}
