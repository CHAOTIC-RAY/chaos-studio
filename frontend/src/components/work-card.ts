import { esc } from "../render-blocks";
import { PROJECT_MEDIA, PROJECT_LIVE_URL, PROJECT_LOGOS, type DeviceMedia } from "../project-media";
import type { Portfolio } from "../types/portfolio";

export type WorkCard = NonNullable<Portfolio["workCards"]>[0];

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

function renderBrowserFrame(media: DeviceMedia, label: string, liveUrl: string, siteHref: string, logo?: string): string {
  const favicon = logo ? `<img class="device__favicon" src="${logo}" alt="" width="18" height="18" loading="lazy" />` : "";
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
  const appIcon = logo ? `<img class="device__app-icon" src="${logo}" alt="" width="20" height="20" loading="lazy" />` : "";
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

function renderProjectHead(proj: WorkCard, featured: boolean): string {
  const label = featured ? "Featured product" : "Web & mobile";
  const logo = PROJECT_LOGOS[proj.slug];
  if (!logo) {
    return `<span class="work-showcase__label">${label}</span><h3 data-cms-field="title">${esc(proj.title)}</h3>`;
  }
  return `
          <div class="work-showcase__brand">
            <img class="work-showcase__logo" src="${logo}" alt="${esc(proj.title)} logo" width="80" height="80" loading="lazy" />
            <div class="work-showcase__brand-copy">
              <span class="work-showcase__label">${label}</span>
              <h3 data-cms-field="title">${esc(proj.title)}</h3>
            </div>
          </div>`;
}

export function renderProject(proj: WorkCard, index: number): string {
  const media = PROJECT_MEDIA[proj.slug] ?? {};
  const liveUrl = PROJECT_LIVE_URL[proj.slug] ?? proj.title;
  const featured = index === 0 || proj.featured;
  const logo = PROJECT_LOGOS[proj.slug];

  const devices: string[] = [];
  if (media.desktop) devices.push(renderBrowserFrame(media.desktop, proj.title, liveUrl, proj.href, logo));
  if (media.mobile) devices.push(renderPhoneFrame(media.mobile, proj.title, logo));

  let deviceBlock = "";
  if (devices.length > 0) {
    const deviceInner = devices.length > 1 ? `<div class="work-showcase__composition">${devices.join("")}</div>` : devices.join("");
    deviceBlock = `
      <div class="work-showcase__devices ${devices.length > 1 ? "work-showcase__devices--dual" : "work-showcase__devices--solo"}" data-tilt-showcase>
        ${deviceInner}
      </div>`;
  } else if (proj.cover) {
    // New work cards using simple cover images
    deviceBlock = `
      <div class="work-showcase__devices work-showcase__devices--cover" data-tilt-showcase>
        <img class="work-showcase__cover" src="${esc(proj.cover)}" alt="${esc(proj.coverAlt ?? proj.title)}" loading="lazy" />
      </div>`;
  } else {
    deviceBlock = `<div class="work-showcase__devices work-showcase__devices--placeholder"><span data-cms-field="title">${esc(proj.title)}</span></div>`;
  }

  const highlights = proj.highlights
    ? `<ul class="work-showcase__highlights">${proj.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
    : "";

  const tags = proj.tags
    ? `<div class="work-showcase__tags">${proj.tags.slice(0, 6).map((t) => `<span>${esc(t)}</span>`).join("")}</div>`
    : "";

  return `
    <article class="work-showcase work-showcase--${esc(proj.slug)} ${featured ? "work-showcase--featured" : ""}" data-reveal data-pano-tilt="5" id="project-${esc(proj.slug)}">
      <div class="work-showcase__glow" aria-hidden="true"></div>
      <div class="work-showcase__stage">
        ${deviceBlock}
        <div class="work-showcase__panel">
          ${renderProjectHead(proj, !!featured)}
          <p class="work-showcase__tagline" data-cms-field="tagline">${esc(proj.tagline || "")}</p>
          ${proj.description ? `<p class="work-showcase__desc" data-cms-field="description">${esc(proj.description)}</p>` : ""}
          ${highlights}
          ${tags}
          <a class="btn btn-primary btn-sm work-showcase__cta" href="${esc(proj.href)}" target="_blank" rel="noopener noreferrer" data-cms-field="cta">${esc(proj.cta || "View Project")}</a>
        </div>
      </div>
    </article>
  `;
}
