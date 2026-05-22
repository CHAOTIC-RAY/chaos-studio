import {
  ICON_CHEVRON_LEFT,
  ICON_CHEVRON_RIGHT,
  ICON_CLOSE,
} from "./icons";

export type LightboxItem =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string; alt: string };

type LightboxMeta = { title: string; client: string };

let root: HTMLElement | null = null;
let stageImg: HTMLImageElement | null = null;
let stageVideo: HTMLVideoElement | null = null;
let captionEl: HTMLElement | null = null;
let prevBtn: HTMLButtonElement | null = null;
let nextBtn: HTMLButtonElement | null = null;
let unmuteBtn: HTMLButtonElement | null = null;

let items: LightboxItem[] = [];
let index = 0;
let meta: LightboxMeta = { title: "", client: "" };
let lastFocus: HTMLElement | null = null;

function ensureLightbox(): void {
  if (root) return;

  root = document.createElement("div");
  root.id = "post-lightbox";
  root.className = "post-lightbox";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Post viewer");
  root.innerHTML = `
    <div class="post-lightbox__backdrop" data-lightbox-close tabindex="-1" aria-hidden="true"></div>
    <div class="post-lightbox__panel">
      <header class="post-lightbox__bar">
        <div class="post-lightbox__meta">
          <p class="post-lightbox__client"></p>
          <p class="post-lightbox__title"></p>
        </div>
        <div class="post-lightbox__actions">
          <button type="button" class="post-lightbox__unmute btn btn-ghost" hidden aria-pressed="true">Unmute</button>
          <button type="button" class="post-lightbox__close btn-icon" data-lightbox-close aria-label="Close viewer">
            ${ICON_CLOSE}
          </button>
        </div>
      </header>
      <div class="post-lightbox__stage">
        <button type="button" class="post-lightbox__nav post-lightbox__nav--prev btn-icon" data-lightbox-prev aria-label="Previous">
          ${ICON_CHEVRON_LEFT}
        </button>
        <div class="post-lightbox__media-wrap">
          <img class="post-lightbox__img" alt="" />
          <video class="post-lightbox__video" playsinline loop controls hidden></video>
        </div>
        <button type="button" class="post-lightbox__nav post-lightbox__nav--next btn-icon" data-lightbox-next aria-label="Next">
          ${ICON_CHEVRON_RIGHT}
        </button>
      </div>
      <p class="post-lightbox__counter" aria-live="polite"></p>
    </div>
  `;

  document.body.appendChild(root);

  stageImg = root.querySelector(".post-lightbox__img");
  stageVideo = root.querySelector(".post-lightbox__video");
  captionEl = root.querySelector(".post-lightbox__counter");
  prevBtn = root.querySelector<HTMLButtonElement>("[data-lightbox-prev]");
  nextBtn = root.querySelector<HTMLButtonElement>("[data-lightbox-next]");
  unmuteBtn = root.querySelector(".post-lightbox__unmute");

  root.querySelectorAll("[data-lightbox-close]").forEach((el) => {
    el.addEventListener("click", closeLightbox);
  });
  prevBtn?.addEventListener("click", () => step(-1));
  nextBtn?.addEventListener("click", () => step(1));

  unmuteBtn?.addEventListener("click", () => {
    if (!stageVideo) return;
    stageVideo.muted = !stageVideo.muted;
    syncLightboxUnmute();
    if (!stageVideo.muted) stageVideo.play().catch(() => {});
  });

  window.addEventListener("keydown", onKeydown);
}

function onKeydown(e: KeyboardEvent): void {
  if (!root || root.hidden) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeLightbox();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    step(-1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    step(1);
  }
}

function syncLightboxUnmute(): void {
  if (!unmuteBtn || !stageVideo) return;
  const muted = stageVideo.muted;
  unmuteBtn.hidden = false;
  unmuteBtn.setAttribute("aria-pressed", String(muted));
  unmuteBtn.textContent = muted ? "Unmute" : "Mute";
}

function renderSlide(): void {
  if (!root || !stageImg || !stageVideo || !captionEl) return;

  const item = items[index];
  if (!item) return;

  const clientEl = root.querySelector(".post-lightbox__client");
  const titleEl = root.querySelector(".post-lightbox__title");
  if (clientEl) clientEl.textContent = meta.client;
  if (titleEl) titleEl.textContent = meta.title;

  stageVideo.pause();
  stageVideo.removeAttribute("src");
  stageVideo.load();

  if (item.type === "video") {
    stageImg.hidden = true;
    stageVideo.hidden = false;
    stageVideo.src = item.src;
    if (item.poster) stageVideo.poster = item.poster;
    stageVideo.muted = true;
    stageVideo.setAttribute("aria-label", item.alt);
    syncLightboxUnmute();
    stageVideo.play().catch(() => {});
    prevBtn?.setAttribute("hidden", "");
    nextBtn?.setAttribute("hidden", "");
    captionEl.textContent = "Reel";
  } else {
    stageVideo.hidden = true;
    unmuteBtn?.setAttribute("hidden", "");
    stageImg.hidden = false;
    stageImg.src = item.src;
    stageImg.alt = item.alt;
    const multi = items.length > 1;
    prevBtn?.toggleAttribute("hidden", !multi);
    nextBtn?.toggleAttribute("hidden", !multi);
    captionEl.textContent = multi ? `${index + 1} / ${items.length}` : "";
  }

  root.setAttribute("aria-label", `${meta.title} — ${item.type === "video" ? "Reel" : `Image ${index + 1} of ${items.length}`}`);
}

function step(delta: -1 | 1): void {
  if (items.length < 2) return;
  index = (index + delta + items.length) % items.length;
  renderSlide();
}

export function openLightbox(nextItems: LightboxItem[], startIndex: number, nextMeta: LightboxMeta): void {
  if (!nextItems.length) return;
  ensureLightbox();
  if (!root) return;

  lastFocus = document.activeElement as HTMLElement | null;
  items = nextItems;
  index = Math.max(0, Math.min(startIndex, items.length - 1));
  meta = nextMeta;

  document.querySelectorAll<HTMLVideoElement>(".post-card__video").forEach((v) => v.pause());

  root.hidden = false;
  document.body.classList.add("lightbox-open");
  renderSlide();
  root.querySelector<HTMLButtonElement>(".post-lightbox__close")?.focus();
}

export function closeLightbox(): void {
  if (!root || root.hidden) return;
  stageVideo?.pause();
  root.hidden = true;
  document.body.classList.remove("lightbox-open");
  lastFocus?.focus();
  lastFocus = null;
  items = [];
  index = 0;
}

export function collectLightboxItems(card: HTMLElement): LightboxItem[] {
  const video = card.querySelector<HTMLVideoElement>(".post-card__video");
  if (video?.src) {
    return [
      {
        type: "video",
        src: video.src,
        poster: video.poster || undefined,
        alt: video.getAttribute("aria-label") || "",
      },
    ];
  }

  const seen = new Set<string>();
  const imgs = card.querySelectorAll<HTMLImageElement>(".post-card__img");
  const out: LightboxItem[] = [];
  imgs.forEach((img) => {
    const src = img.currentSrc || img.src;
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push({ type: "image", src, alt: img.alt || "" });
  });
  return out;
}

export function initPostLightbox(): () => void {
  ensureLightbox();

  const onClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-post-view]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const card = btn.closest<HTMLElement>(".post-card");
    if (!card) return;

    const lightboxItems = collectLightboxItems(card);
    if (!lightboxItems.length) return;

    let startIndex = 0;
    const carousel = card.querySelector(".post-card__carousel--js");
    if (carousel && lightboxItems.length > 1) {
      const active = carousel.querySelector<HTMLElement>(".post-card__slide.is-active");
      const activeImg = active?.querySelector<HTMLImageElement>(".post-card__img");
      if (activeImg) {
        const src = activeImg.currentSrc || activeImg.src;
        const idx = lightboxItems.findIndex((it) => it.type === "image" && it.src === src);
        if (idx >= 0) startIndex = idx;
      }
    }

    const title = card.querySelector(".post-card__body h3")?.textContent?.trim() || "Post";
    const client = card.querySelector(".post-card__client")?.textContent?.trim() || "";

    openLightbox(lightboxItems, startIndex, { title, client });
  };

  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
