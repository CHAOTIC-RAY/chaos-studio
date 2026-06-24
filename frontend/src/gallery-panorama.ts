import { openLightbox, type LightboxItem } from "./post-lightbox";
import { prefersReducedMotion } from "./motion/reduced-motion";
import type { Portfolio } from "./types/portfolio";
import { PROJECT_MEDIA, type DeviceMedia } from "./project-media";

type SocialPost = Portfolio["socialPosts"]["items"][0];

interface PanoTile {
  id: string;
  cover: string;
  coverFull: string;
  alt: string;
  client: string;
  title: string;
  kind: string;
  tags: string[];
  items: LightboxItem[];
  /** Set for product / web-app tiles so they render with a screenshot-optimized layout. */
  variant?: "app-desktop" | "app-mobile";
  /** Preview reel for the tile (full video in lightbox items) */
  videoSrc?: string;
  videoSrcFull?: string;
}

const POSTS_DIR = "/images/posts";
const PRELOAD_CONCURRENCY = 6;
const MOBILE_PRIORITY_COUNT = 14;
const MOBILE_LOADER_MAX_MS = 1400;

/** Lighter assets for panorama tiles (full res kept for lightbox). */
function toPanoThumb(src: string): string {
  return src.replace(/\.webp$/i, ".pano.webp");
}

function toPanoPreview(src: string): string {
  return src.replace(/\/video\.mp4$/i, "/preview.mp4");
}

/** Deduped cover loads — tries pano thumb first, falls back to full res. */
const coverLoadCache = new Map<string, Promise<string>>();

function loadCover(panoUrl: string, fullUrl: string): Promise<string> {
  const cached = coverLoadCache.get(panoUrl);
  if (cached) return cached;

  const promise = new Promise<string>((resolve) => {
    const tryUrl = (url: string, fallback?: string) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => {
        if (fallback) tryUrl(fallback);
        else resolve(fullUrl);
      };
      img.src = url;
    };
    tryUrl(panoUrl, fullUrl);
  });
  coverLoadCache.set(panoUrl, promise);
  return promise;
}

async function preloadTiles(
  tileList: PanoTile[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const queue = [...tileList];
  const total = queue.length;
  let done = 0;
  const bump = () => {
    done += 1;
    onProgress?.(done, total);
  };
  const workers = Array.from({ length: Math.min(PRELOAD_CONCURRENCY, queue.length) }, async () => {
    while (queue.length) {
      const tile = queue.shift()!;
      await loadCover(tile.cover, tile.coverFull).catch(() => tile.coverFull);
      bump();
    }
  });
  await Promise.all(workers);
}

type CellRefs = {
  img: HTMLImageElement;
  video: HTMLVideoElement;
  play: HTMLButtonElement;
  badge: HTMLElement;
};

function cellRefs(el: HTMLElement): CellRefs {
  return (el as HTMLElement & { _panoRefs?: CellRefs })._panoRefs!;
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
    return n > 0 ? `Media kit · ${n}` : "Media kit";
  }
  const n = post.slides?.length ?? 0;
  if (n > 1) return `${n} slides`;
  return post.platform || "Image";
}

function postSlideSrc(post: SocialPost, slide: string): string {
  if (post.slides?.length) return `${POSTS_DIR}/${post.id}/${slide}.webp`;
  return `${POSTS_DIR}/${post.id}.webp`;
}

function tileFromPost(post: SocialPost): PanoTile {
  const alt = `${post.title} — ${post.client}`;
  let items: LightboxItem[];
  const coverFull = post.video
    ? `${POSTS_DIR}/${post.id}/${post.poster ?? "poster.webp"}`
    : post.slides?.length
      ? postSlideSrc(post, post.slides[0])
      : `${POSTS_DIR}/${post.id}.webp`;

  if (post.video) {
    const src = `${POSTS_DIR}/${post.id}/${post.video}`;
    items = [{ type: "video", src, poster: coverFull, alt }];
  } else if (post.slides?.length) {
    items = post.slides.map((s) => ({ type: "image", src: postSlideSrc(post, s), alt }));
  } else {
    items = [{ type: "image", src: coverFull, alt }];
  }

  const videoFull = post.video ? `${POSTS_DIR}/${post.id}/${post.video}` : undefined;
  return {
    id: post.id,
    cover: toPanoThumb(coverFull),
    coverFull,
    alt,
    client: post.client,
    title: post.title,
    kind: postKindLabel(post),
    tags: post.tags.slice(0, 3),
    items,
    videoSrc: videoFull ? toPanoPreview(videoFull) : undefined,
    videoSrcFull: videoFull,
  };
}

/**
 * Product / web-app tiles — shown in the panorama alongside the social posts
 * but styled to show off full app screenshots (contained, branded backdrop).
 */
function appTilesFromPortfolio(portfolio: Portfolio): PanoTile[] {
  const tiles: PanoTile[] = [];
  for (const proj of portfolio.featuredWork.projects) {
    const media = PROJECT_MEDIA[proj.id];
    if (!media) continue;
    const tags = (proj.tags ?? []).slice(0, 3);
    const devices: ["desktop" | "mobile", DeviceMedia | undefined][] = [
      ["desktop", media.desktop],
      ["mobile", media.mobile],
    ];
    for (const [device, dm] of devices) {
      if (!dm) continue;
      const alt = `${proj.name} \u2014 ${device} UI`;
      const frames = dm.frames?.length ? dm.frames : [dm.image];
      tiles.push({
        id: `app-${proj.id}-${device}`,
        cover: toPanoThumb(dm.image),
        coverFull: dm.image,
        alt,
        client: proj.name,
        title: proj.tagline,
        kind: device === "desktop" ? "Web app" : "App design",
        tags: tags.length ? tags : ["UI/UX", device === "desktop" ? "Web" : "Mobile"],
        items: frames.map((src) => ({ type: "image", src, alt })),
        variant: device === "desktop" ? "app-desktop" : "app-mobile",
      });
    }
  }
  return tiles;
}

/** Layout + curvature constants */
const GAP = 18;
const MARGIN = 1; // extra ring of cells so pan + 3D rotation never exposes empty edges
const DRAG_THRESHOLD = 7;
const VIDEO_NEAR = 0.44;
const VIDEO_FAR = 0.58;
const CENTER_SCALE = 0.14;
const CENTER_FALLOFF = 0.88;
const SCALE_SLOT_PAD = 0.03;
const EDGE_SHRINK = 0.46;
const DEPTH_PULL = 360;

function tileMetrics(): { tileW: number; tileH: number; cols: number } {
  const vw = window.innerWidth;
  if (vw < 560) return { tileW: 148, tileH: 196, cols: 6 };
  if (vw < 900) return { tileW: 178, tileH: 232, cols: 7 };
  if (vw < 1400) return { tileW: 210, tileH: 272, cols: 8 };
  return { tileW: 236, tileH: 306, cols: 9 };
}

export function initGalleryPanorama(portfolio: Portfolio): () => void {
  const stage = document.querySelector<HTMLElement>("[data-pano-stage]");
  const plane = document.querySelector<HTMLElement>("[data-pano-plane]");
  if (!stage || !plane) return () => {};

  const postTiles = portfolio.galleryPosts.items.length
    ? [
        ...portfolio.galleryPosts.items,
        ...portfolio.socialPosts.items.filter(
          (p) => !portfolio.galleryPosts.items.some((g) => g.id === p.id),
        ),
      ]
    : portfolio.socialPosts.items;
  const postPanoTiles = postTiles
    .filter((p) => !p.id.startsWith("_"))
    .map(tileFromPost);
  // App designs lead the grid so they're the first thing the eye lands on.
  const allTiles = [...appTilesFromPortfolio(portfolio), ...postPanoTiles];
  if (!allTiles.length) return () => {};

  let tiles = allTiles;
  const reduced = prefersReducedMotion();

  let { tileW, tileH, cols } = tileMetrics();
  let cellW = tileW + GAP;
  let cellH = tileH + GAP;

  // World pan offset (in px). Centre the grid initially.
  let ox = 0;
  let oy = 0;
  let vx = 0;
  let vy = 0;
  let introBoost = 5.5;

  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let pointerId: number | null = null;
  let downTile: string | null = null;

  // Fixed cell pool: the DOM grid is allocated once (and only on resize), and
  // panning just re-points each cell at a new world coordinate. This avoids the
  // per-frame createElement/remove churn that made dragging janky.
  let cellEls: HTMLElement[] = [];
  const cellState: {
    id: string;
    op: number;
    z: number;
    scale: number;
    transform: string;
    videoZone: "" | "near" | "far";
  }[] = [];
  let cellsX = 0;
  let cellsY = 0;
  let raf = 0;
  let running = false;
  let dirty = true;
  let activeVideo: HTMLVideoElement | null = null;
  let frame = 0;

  function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
  }

  function buildCell(parent: ParentNode): HTMLElement {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "pano-tile";
    el.innerHTML = `
      <span class="pano-tile__head">
        <span class="pano-tile__client" data-client></span>
        <span class="pano-tile__name" data-name></span>
      </span>
      <span class="pano-tile__media">
        <img class="pano-tile__img" alt="" loading="eager" decoding="async" draggable="false" />
        <video class="pano-tile__video" muted loop playsinline preload="none" hidden></video>
        <button type="button" class="pano-tile__play" hidden aria-label="Play reel">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        </button>
        <span class="pano-tile__reel-badge" hidden>Reel</span>
      </span>
      <span class="pano-tile__foot">
        <span class="pano-tile__tags" data-tags></span>
        <span class="pano-tile__kind" data-kind></span>
      </span>`;
    const refs: CellRefs = {
      img: el.querySelector(".pano-tile__img")!,
      video: el.querySelector(".pano-tile__video")!,
      play: el.querySelector(".pano-tile__play")!,
      badge: el.querySelector(".pano-tile__reel-badge")!,
    };
    (el as HTMLElement & { _panoRefs?: CellRefs })._panoRefs = refs;
    refs.play.addEventListener("pointerdown", (e) => e.stopPropagation());
    refs.play.addEventListener("click", (e) => {
      e.stopPropagation();
      void refs.video.play().catch(() => {});
    });
    parent.appendChild(el);
    return el;
  }

  function buildGrid(): void {
    plane!.textContent = "";
    cellEls = [];
    cellState.length = 0;
    const vw = stage!.clientWidth || window.innerWidth;
    const vh = stage!.clientHeight || window.innerHeight;
    cellsX = Math.ceil(vw / cellW) + MARGIN * 2 + 2;
    cellsY = Math.ceil(vh / cellH) + MARGIN * 2 + 2;
    const frag = document.createDocumentFragment();
    const total = cellsX * cellsY;
    for (let i = 0; i < total; i++) {
      cellEls.push(buildCell(frag));
      cellState.push({ id: "", op: -1, z: -1, scale: 1, transform: "", videoZone: "" });
    }
    plane!.appendChild(frag);
  }

  function fillCell(el: HTMLElement, tile: PanoTile): void {
    if (el.dataset.tileId === tile.id) return;
    el.dataset.tileId = tile.id;
    el.classList.toggle("pano-tile--app", !!tile.variant);
    el.classList.toggle("pano-tile--app-desktop", tile.variant === "app-desktop");
    el.classList.toggle("pano-tile--app-mobile", tile.variant === "app-mobile");
    el.classList.toggle("pano-tile--reel", !!tile.videoSrc);
    const { img, video, badge } = cellRefs(el);
    const st = cellState[cellEls.indexOf(el)];
    if (st) st.videoZone = "";

    if (tile.videoSrc) {
      img.hidden = false;
      img.alt = tile.alt;
      video.hidden = true;
      video.pause();
      video.removeAttribute("src");
      video.load();
      badge.hidden = false;
    } else {
      img.hidden = false;
      video.hidden = true;
      badge.hidden = true;
      video.pause();
      video.removeAttribute("src");
      img.alt = tile.alt;
    }
    const tileId = tile.id;
    void loadCover(tile.cover, tile.coverFull).then((url) => {
      if (el.dataset.tileId !== tileId) return;
      img.src = url;
    });
    el.querySelector("[data-client]")!.textContent = tile.client;
    el.querySelector("[data-name]")!.textContent = tile.title;
    el.querySelector("[data-kind]")!.textContent = tile.kind;
    el.querySelector("[data-tags]")!.innerHTML = tile.tags
      .map((t) => `<span class="pano-tile__tag">${t}</span>`)
      .join("");
    el.setAttribute("aria-label", `${tile.title} — ${tile.client}. Open viewer.`);
  }

  function syncVideo(
    el: HTMLElement,
    tile: PanoTile,
    dist: number,
    st: (typeof cellState)[number],
  ): void {
    if (!tile.videoSrc) return;
    const { img, video, play } = cellRefs(el);
    const wantNear = dist < VIDEO_NEAR;
    const wantFar = dist > VIDEO_FAR;
    let zone = st.videoZone || "far";
    if (wantNear) zone = "near";
    else if (wantFar) zone = "far";

    if (zone !== st.videoZone) {
      const enteringNear = zone === "near";
      st.videoZone = zone;
      if (zone === "near") {
        if (!video.src) {
          video.src = tile.videoSrc!;
          video.poster = tile.cover;
        }
        img.hidden = true;
        video.hidden = false;
        if (enteringNear && video.paused && (!activeVideo || activeVideo === video)) {
          void video.play().then(() => {
            play.hidden = true;
            el.classList.remove("pano-tile--paused");
            activeVideo = video;
          }).catch(() => {
            play.hidden = false;
            el.classList.add("pano-tile--paused");
          });
        }
      } else {
        video.pause();
        if (activeVideo === video) activeVideo = null;
        video.removeAttribute("src");
        video.load();
        video.hidden = true;
        img.hidden = false;
        play.hidden = true;
        el.classList.remove("pano-tile--paused");
      }
      return;
    }

    if (zone !== "near") return;

    const paused = video.paused;
    play.hidden = !paused;
    el.classList.toggle("pano-tile--paused", paused);
    if (!paused) activeVideo = video;
  }

  function tileScale(centerBoost: number): number {
    // Squared falloff — only the true centre tile grows; neighbours stay in their slot.
    const boost = centerBoost * centerBoost;
    const maxScale = cellW / tileW - SCALE_SLOT_PAD;
    return Math.min(maxScale, 1 + boost * CENTER_SCALE);
  }

  function render(): void {
    const vw = stage!.clientWidth;
    const vh = stage!.clientHeight;
    const cx = vw / 2;
    const cy = vh / 2;
    const n = tiles.length;
    // Tighter radius so corner tiles fall off faster in scale/opacity.
    const maxR = Math.hypot(vw, vh) / 2.35 || 1;

    const baseCol = Math.floor(ox / cellW) - MARGIN - 1;
    const baseRow = Math.floor(oy / cellH) - MARGIN - 1;

    let k = 0;
    for (let lj = 0; lj < cellsY; lj++) {
      const worldRow = baseRow + lj;
      const sy = worldRow * cellH - oy;
      const tileCy = sy + tileH / 2;
      const ny = (tileCy - cy) / maxR;
      for (let li = 0; li < cellsX; li++, k++) {
        const worldCol = baseCol + li;
        const el = cellEls[k];
        const st = cellState[k];

        // Sheared indexing so rows don't line up into obvious vertical repeats.
        const idx = mod(worldRow * (cols + 1) + worldCol, n);
        const tile = tiles[idx];
        if (st.id !== tile.id) {
          fillCell(el, tile);
          st.id = tile.id;
        }

        const sx = worldCol * cellW - ox;
        const tileCx = sx + tileW / 2;
        const nx = (tileCx - cx) / maxR;
        const dist = Math.min(1.25, Math.hypot(nx, ny));

        const centerBoost = Math.max(0, 1 - dist / CENTER_FALLOFF);
        const edgeFactor = 1 - Math.min(EDGE_SHRINK, dist * dist * 0.38);
        const scale = tileScale(centerBoost) * edgeFactor;
        // Push enlarged tiles away from viewport centre so card edges never stack.
        const grow = scale - 1;
        const pushX = nx * grow * tileW * 0.72;
        const pushY = ny * grow * tileH * 0.38;
        const drawX = sx + pushX;
        const drawY = sy + pushY;

        let transform = `translate3d(${drawX.toFixed(1)}px, ${drawY.toFixed(1)}px, 0)`;
        if (!reduced) {
          const rotY = nx * 34 * Math.min(1, dist / 0.35);
          const rotX = -ny * 24 * Math.min(1, dist / 0.35);
          const tz = -(dist * dist) * DEPTH_PULL;
          transform += ` rotateY(${rotY.toFixed(1)}deg) rotateX(${rotX.toFixed(1)}deg) translateZ(${tz.toFixed(0)}px) scale(${scale.toFixed(2)})`;
        } else {
          transform += ` scale(${scale.toFixed(2)})`;
        }
        if (transform !== st.transform) {
          el.style.transform = transform;
          st.transform = transform;
        }

        // opacity / z-index only repaint when they actually change
        const op = Math.round((0.32 + centerBoost * 0.58) * edgeFactor * 100) / 100;
        if (op !== st.op) {
          el.style.opacity = String(op);
          st.op = op;
        }
        const z =
          Math.round((1 - dist) * 1_000_000 - Math.abs(nx) * 12_000 - Math.abs(ny) * 2_000) +
          200_000 +
          k;
        if (z !== st.z) {
          el.style.zIndex = String(z);
          st.z = z;
        }
        if (scale !== st.scale) {
          st.scale = scale;
        }

        syncVideo(el, tile, dist, st);
      }
    }
  }

  function tick(): void {
    frame++;
    let needs = dirty;
    dirty = false;
    if (!dragging && (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05)) {
      ox += vx;
      oy += vy;
      vx *= 0.93;
      vy *= 0.93;
      needs = true;
    }
    if (!dragging && !reduced) {
      ox += 0.62 + introBoost;
      oy += 0.1 + introBoost * 0.05;
      if (introBoost > 0.01) introBoost *= 0.971;
      else introBoost = 0;
      needs = true;
    }
    if (needs) {
      const glide = !dragging && Math.abs(vx) < 0.08 && Math.abs(vy) < 0.08;
      if (!glide || frame % 2 === 0) render();
    }
    if (running) raf = requestAnimationFrame(tick);
  }

  function startLoop(): void {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }
  function stopLoop(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  // --- pointer drag ---
  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragging = true;
    moved = 0;
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    vx = 0;
    vy = 0;
    const tileEl = (e.target as HTMLElement).closest<HTMLElement>(".pano-tile");
    downTile = tileEl?.dataset.tileId ?? null;
    stage!.classList.add("is-grabbing");
    stage!.setPointerCapture?.(e.pointerId);
    hideHint();
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    ox -= dx;
    oy -= dy;
    vx = -dx;
    vy = -dy;
    moved += Math.abs(dx) + Math.abs(dy);
    dirty = true;
  }

  function onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    stage!.classList.remove("is-grabbing");
    if (moved < DRAG_THRESHOLD && downTile) {
      const tile = tiles.find((t) => t.id === downTile);
      if (tile) openLightbox(tile.items, 0, { title: tile.title, client: tile.client });
    }
    downTile = null;
    startLoop();
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    hideHint();
    const horizontal = e.shiftKey;
    ox += horizontal ? e.deltaY : e.deltaX;
    oy += horizontal ? 0 : e.deltaY;
    vx = 0;
    vy = 0;
    dirty = true;
  }

  function hideHint(): void {
    document.querySelector("[data-pano-hint]")?.setAttribute("hidden", "");
  }

  function tilesForVisibleGrid(source: PanoTile[] = tiles): PanoTile[] {
    const n = source.length;
    if (!n || !cellsX || !cellsY) return source.slice(0, MOBILE_PRIORITY_COUNT);
    const indices = new Set<number>();
    const baseCol = Math.floor(ox / cellW) - MARGIN - 1;
    const baseRow = Math.floor(oy / cellH) - MARGIN - 1;
    for (let lj = 0; lj < cellsY; lj++) {
      for (let li = 0; li < cellsX; li++) {
        indices.add(mod((baseRow + lj) * (cols + 1) + (baseCol + li), n));
      }
    }
    return [...indices].map((i) => source[i]);
  }

  function preloadTileAssets(tileList: PanoTile[]): Promise<void> {
    const loader = document.querySelector<HTMLElement>("[data-pano-loader]");
    const bar = loader?.querySelector<HTMLElement>("[data-pano-loader-bar]");
    return preloadTiles(tileList, (done, total) => {
      if (bar && total) bar.style.width = `${Math.round((done / total) * 100)}%`;
    });
  }

  async function dismissLoader(): Promise<void> {
    const loader = document.querySelector<HTMLElement>("[data-pano-loader]");
    if (!loader) return;
    loader.classList.add("is-done");
    await new Promise((r) => setTimeout(r, 420));
    loader.remove();
  }

  function onResize(): void {
    ({ tileW, tileH, cols } = tileMetrics());
    cellW = tileW + GAP;
    cellH = tileH + GAP;
    stage!.style.setProperty("--tile-w", `${tileW}px`);
    stage!.style.setProperty("--tile-h", `${tileH}px`);
    buildGrid();
    dirty = true;
    render();
  }

  // --- view toggle (grid / list) ---
  const root = document.querySelector<HTMLElement>("[data-pano-root]");
  const listEl = document.querySelector<HTMLElement>("[data-pano-list]");
  function buildList(): void {
    if (!listEl) return;
    listEl.innerHTML = tiles
      .map(
        (t) => `
        <button type="button" class="pano-list__row" data-list-id="${t.id}">
          <span class="pano-list__client">${t.client}</span>
          <span class="pano-list__title">${t.title}</span>
          <span class="pano-list__kind">${t.kind}</span>
        </button>`,
      )
      .join("");
  }
  function onListClick(e: Event): void {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-list-id]");
    if (!row) return;
    const tile = tiles.find((t) => t.id === row.dataset.listId);
    if (tile) openLightbox(tile.items, 0, { title: tile.title, client: tile.client });
  }

  const viewBtns = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-pano-view]"));
  function setView(view: "grid" | "list"): void {
    root?.setAttribute("data-view", view);
    viewBtns.forEach((b) => {
      const on = b.dataset.panoView === view;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (view === "grid") {
      startLoop();
      render();
    } else {
      stopLoop();
    }
  }
  const viewHandlers = viewBtns.map((b) => {
    const h = () => setView((b.dataset.panoView as "grid" | "list") ?? "grid");
    b.addEventListener("click", h);
    return [b, h] as const;
  });

  // --- filter by client ---
  const filterBtn = document.querySelector<HTMLButtonElement>("[data-pano-filter-btn]");
  const filterPanel = document.querySelector<HTMLElement>("[data-pano-filter]");
  const clients = Array.from(new Set(allTiles.map((t) => t.client))).sort((a, b) =>
    a.localeCompare(b),
  );
  if (filterPanel) {
    filterPanel.innerHTML =
      `<button type="button" class="pano-filter__opt is-active" data-filter="">All work <span>${allTiles.length}</span></button>` +
      clients
        .map((c) => {
          const count = allTiles.filter((t) => t.client === c).length;
          return `<button type="button" class="pano-filter__opt" data-filter="${c}">${c} <span>${count}</span></button>`;
        })
        .join("");
  }
  function applyFilter(client: string): void {
    tiles = client ? allTiles.filter((t) => t.client === client) : allTiles;
    if (!tiles.length) tiles = allTiles;
    ox = 0;
    oy = 0;
    for (const st of cellState) {
      st.id = "";
      st.transform = "";
      st.videoZone = "";
    }
    buildList();
    dirty = true;
    render();
    if (filterBtn) {
      const labelEl = filterBtn.querySelector("[data-pano-filter-label]");
      if (labelEl) labelEl.textContent = client || "Filter";
    }
  }
  function onFilterClick(e: Event): void {
    const opt = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-filter]");
    if (!opt) return;
    filterPanel
      ?.querySelectorAll(".pano-filter__opt")
      .forEach((o) => o.classList.toggle("is-active", o === opt));
    applyFilter(opt.dataset.filter ?? "");
    closeFilter();
  }
  function openFilter(): void {
    root?.classList.add("filter-open");
    filterBtn?.setAttribute("aria-expanded", "true");
  }
  function closeFilter(): void {
    root?.classList.remove("filter-open");
    filterBtn?.setAttribute("aria-expanded", "false");
  }
  function toggleFilter(): void {
    if (root?.classList.contains("filter-open")) closeFilter();
    else openFilter();
  }
  function onDocClick(e: Event): void {
    if (!root?.classList.contains("filter-open")) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-pano-filter]") || t.closest("[data-pano-filter-btn]")) return;
    closeFilter();
  }

  // --- wire up ---
  stage.style.setProperty("--tile-w", `${tileW}px`);
  stage.style.setProperty("--tile-h", `${tileH}px`);
  buildGrid();
  buildList();

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const priorityTiles = tilesForVisibleGrid(allTiles);
  const priorityIds = new Set(priorityTiles.map((t) => t.id));
  const restTiles = allTiles.filter((t) => !priorityIds.has(t.id));

  const boot = async (): Promise<void> => {
    if (isMobile) {
      await Promise.race([
        preloadTileAssets(priorityTiles),
        new Promise<void>((r) => setTimeout(r, MOBILE_LOADER_MAX_MS)),
      ]);
      await dismissLoader();
      if (restTiles.length) void preloadTileAssets(restTiles);
    } else {
      document.querySelector("[data-pano-loader]")?.remove();
      void preloadTileAssets(allTiles);
    }
    dirty = true;
    render();
    startLoop();
  };
  void boot();

  // Pause the rAF loop whenever the stage scrolls out of view or the tab is
  // hidden, so the gallery never burns CPU in the background.
  let visible = true;
  const inView = (): boolean =>
    visible && !document.hidden && root?.getAttribute("data-view") !== "list";
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (inView()) startLoop();
      else stopLoop();
    },
    { threshold: 0 },
  );
  io.observe(stage);
  const onVisibility = (): void => {
    if (inView()) startLoop();
    else stopLoop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  stage.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  stage.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", onResize);
  listEl?.addEventListener("click", onListClick);
  filterPanel?.addEventListener("click", onFilterClick);
  filterBtn?.addEventListener("click", toggleFilter);
  document.addEventListener("click", onDocClick);

  return () => {
    stopLoop();
    stage.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    stage.removeEventListener("wheel", onWheel);
    window.removeEventListener("resize", onResize);
    listEl?.removeEventListener("click", onListClick);
    filterPanel?.removeEventListener("click", onFilterClick);
    filterBtn?.removeEventListener("click", toggleFilter);
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("visibilitychange", onVisibility);
    viewHandlers.forEach(([b, h]) => b.removeEventListener("click", h));
    io.disconnect();
    cellEls.forEach((el) => {
      el.querySelector<HTMLVideoElement>(".pano-tile__video")?.pause();
      el.remove();
    });
    cellEls = [];
    cellState.length = 0;
  };
}
