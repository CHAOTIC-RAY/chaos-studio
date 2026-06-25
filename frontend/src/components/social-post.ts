import { esc } from "../render";
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from "../icons";
import { galleryUrl } from "../router";
import type { Portfolio, SocialPostItem as SocialPost } from "../types/portfolio";

const POST_ACCENTS: Record<string, string> = {
  purple: "post-card--purple",
  lime: "post-card--lime",
  pink: "post-card--pink",
  "cyan-500": "post-card--cyan",
  white: "post-card--white",
  neutral: "post-card--neutral",
};

export function visiblePosts(items: SocialPost[]): SocialPost[] {
  return items.filter((post) => !post.id.startsWith("_"));
}

export function renderPostsSection(social: Portfolio["socialPosts"]): string {
  const items = visiblePosts(social.items);
  return `
        <div class="section-head section-head--posts" data-reveal>
          <div class="section-head__copy">
            <p class="eyebrow">Campaign & feed</p>
            <h2>${esc(social.subtitle)}</h2>
          </div>
        </div>
        <div class="posts-panel" id="posts-panel" data-posts-panel data-reveal>
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
            <p class="posts-rail__hint">Auto-scrolls smoothly · drag or use arrows · browse our panoramic gallery below</p>
          </div>
        </div>
        <div class="posts-pano-cta" data-reveal>
          <a class="btn btn-primary" href="${galleryUrl()}" data-route-link data-magnetic>
            Enter the panoramic gallery
          </a>
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

export function renderPostCard(post: SocialPost, opts?: { feed?: "rail" | "expanded" }): string {
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
