import type { Portfolio } from "./types/portfolio";

const PROJECT_IMAGES: Record<string, { desktop?: string; mobile?: string }> = {
  cookxpert: {
    desktop: "/images/projects/cookxpert_desktop.png",
    mobile: "/images/projects/cookxpert_mobile.png",
  },
  forge: {
    desktop: "/images/projects/forge_desktop.png",
    mobile: "/images/projects/forge_mobile.png",
  },
  faisa: { mobile: "/images/projects/faisa_mobile.png" },
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
    { id: "studio", label: "Studio" },
    { id: "experience", label: "Experience" },
    { id: "posts", label: "Posts" },
    { id: "work", label: "Work" },
    { id: "skills", label: "Skills" },
    { id: "contact", label: "Contact" },
  ];

  return `
    <div class="bg-layers" aria-hidden="true">
      <canvas id="bg-canvas"></canvas>
      <div class="bg-blobs"></div>
      <div class="bg-grain"></div>
    </div>
    <div class="scroll-progress" aria-hidden="true"></div>
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="site-header">
      <a class="logo" href="#top">
        <span class="logo-mark" aria-hidden="true"></span>
        <span class="logo-text">${esc(p.profile.name)}</span>
      </a>
      <nav class="nav" aria-label="Primary">
        ${nav.map((l) => `<a href="#${l.id}">${l.label}</a>`).join("")}
      </nav>
      <a class="nav-cta" href="${esc(p.profile.portfolioUrl)}" target="_blank" rel="noopener noreferrer">chaosstudio.mv</a>
    </header>

    <main id="main">
      <section id="top" class="hero">
        <p class="hero-eyebrow eyebrow">${esc(p.profile.tagline)}</p>
        <h1 class="hero-title">
          <span class="hero-line">${esc(p.profile.name)}</span>
          <span class="hero-line hero-line--dim">Visual stories</span>
        </h1>
        <p class="hero-sub">${esc(p.profile.role)} · ${esc(p.objective.body.slice(0, 120))}…</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#work" data-magnetic>View featured work</a>
          <a class="btn btn-ghost" href="#contact" data-magnetic>Get in touch</a>
        </div>
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
          <p class="eyebrow">Selected posts</p>
          <h2>${esc(p.socialPosts.subtitle)}</h2>
        </div>
        <div class="posts-viewport" data-reveal>
          <div class="posts-track">
            ${[...p.socialPosts.items, ...p.socialPosts.items]
              .map(
                (post) => `
              <article class="post-card ${POST_ACCENTS[post.accent] ?? "post-card--purple"}">
                <span class="post-platform">${esc(post.platform)}</span>
                <h3>${esc(post.title)}</h3>
                <p class="post-client">${esc(post.client)}</p>
                <p>${esc(post.description)}</p>
                <div class="post-tags">${post.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
              </article>
            `,
              )
              .join("")}
          </div>
        </div>
      </section>

      <section id="work" class="section">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Featured work</p>
          <h2>${esc(p.featuredWork.subtitle)}</h2>
        </div>
        <div class="work-stack">
          ${p.featuredWork.projects.map((proj) => renderProject(proj)).join("")}
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
              <div class="tools">${cat.tools.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
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

      <section id="contact" class="section section--contact">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Contact</p>
          <h2>Let's work together</h2>
        </div>
        <div class="contact-row" data-reveal>
          <div class="contact-chips">
            <a href="mailto:${esc(p.contact.email)}">${esc(p.contact.email)}</a>
            <a href="tel:${esc(p.contact.phone.replace(/\s/g, ""))}">${esc(p.contact.phone)}</a>
            <a href="${esc(p.contact.instagramUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.contact.instagram)}</a>
            <a href="${esc(p.contact.telegramUrl)}" target="_blank" rel="noopener noreferrer">Telegram</a>
            <a href="${esc(p.contact.whatsappUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
          <form id="contact-form" class="contact-form glass-card" novalidate>
            <label><span>Name</span><input name="name" required autocomplete="name" /></label>
            <label><span>Email</span><input name="email" type="email" required autocomplete="email" /></label>
            <label><span>Message</span><textarea name="message" rows="4" required></textarea></label>
            <button type="submit" class="btn btn-primary" data-magnetic>Send message</button>
            <p id="form-feedback" class="form-feedback" role="status"></p>
          </form>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${esc(p.profile.name)} · ${esc(p.profile.role)}</p>
      <a href="${esc(p.profile.portfolioUrl)}" target="_blank" rel="noopener noreferrer">chaosstudio.mv</a>
    </footer>
  `;
}

function renderProject(proj: Portfolio["featuredWork"]["projects"][0]): string {
  const imgs = PROJECT_IMAGES[proj.id] ?? {};
  const preview = imgs.desktop
    ? `<div class="work-preview work-preview--dual">
        <div class="work-mock work-mock--desktop" style="background-image:url('${imgs.desktop}')"></div>
        ${imgs.mobile ? `<div class="work-mock work-mock--mobile" style="background-image:url('${imgs.mobile}')"></div>` : ""}
      </div>`
    : imgs.mobile
      ? `<div class="work-preview"><div class="work-mock work-mock--mobile-only" style="background-image:url('${imgs.mobile}')"></div></div>`
      : `<div class="work-preview work-preview--placeholder"><span>${esc(proj.name)}</span></div>`;

  return `
    <article class="work-card glass-card" data-reveal id="project-${esc(proj.id)}">
      <span class="work-badge">Recent work</span>
      ${preview}
      <div class="work-body">
        <div class="work-meta">
          <div>
            <h3>${esc(proj.name)}</h3>
            <p class="work-tagline">${esc(proj.tagline)}</p>
          </div>
          <a class="btn btn-primary btn-sm" href="${esc(proj.href)}" target="_blank" rel="noopener noreferrer">${esc(proj.cta)}</a>
        </div>
        ${proj.description ? `<p>${esc(proj.description)}</p>` : ""}
        ${proj.highlights ? `<ul class="bullet-list">${proj.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        ${proj.tags ? `<div class="tag-row">${proj.tags.slice(0, 6).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
      </div>
    </article>
  `;
}
