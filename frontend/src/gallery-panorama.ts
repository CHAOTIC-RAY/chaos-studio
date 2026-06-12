import { openLightbox, type LightboxItem } from "./post-lightbox";
import { prefersReducedMotion } from "./motion/reduced-motion";
import type { Portfolio } from "./types/portfolio";

type SocialPost = Portfolio["socialPosts"]["items"][0];

interface PanoTile {
  id: string;
  cover: string;
  alt: string;
  client: string;
  title: string;
  kind: string;
  tags: string[];
  items: LightboxItem[];
}

const POSTS_DIR = "/images/posts";

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

function postImageBase(post: SocialPost): string {
  return post.image?.trim() || post.id;
}

function postSlideSrc(post: SocialPost, slide: string): string {
  if (post.slides?.length) return `${POSTS_DIR}/${post.id}/${slide}.webp`;
  return `${POSTS_DIR}/${postImageBase(post)}.webp`;
}

function tileFromPost(post: SocialPost): PanoTile {
  const alt = `${post.title} — ${post.client}`;
  let cover: string;
  let items: LightboxItem[];
  if (post.video) {
    const src = `${POSTS_DIR}/${post.id}/${post.video}`;
    cover = `${POSTS_DIR}/${post.id}/${post.poster ?? "poster.webp"}`;
    items = [{ type: "video", src, poster: cover, alt }];
  } else if (post.slides?.length) {
    cover = postSlideSrc(post, post.slides[0]);
    items = post.slides.map((s) => ({ type: "image", src: postSlideSrc(post, s), alt }));
  } else {
    cover = `${POSTS_DIR}/${postImageBase(post)}.webp`;
    items = [{ type: "image", src: cover, alt }];
  }
  return {
    id: post.id,
    cover,
    alt,
    client: post.client,
    title: post.title,
    kind: postKindLabel(post),
    tags: post.tags.slice(0, 3),
    items,
  };
}

/** Layout + curvature constants */
const GAP = 26;
const MARGIN = 1; // extra ring of cells around viewport for the curved edges
const DRAG_THRESHOLD = 7;

function tileMetrics(): { tileW: number; tileH: number; cols: number } {
  const vw = window.innerWidth;
  if (vw < 560) return { tileW: 190, tileH: 250, cols: 5 };
  if (vw < 900) return { tileW: 230, tileH: 300, cols: 6 };
  if (vw < 1400) return { tileW: 270, tileH: 350, cols: 7 };
  return { tileW: 300, tileH: 388, cols: 8 };
}

export function initGalleryPanorama(portfolio: Portfolio): () => void {
  const stage = document.querySelector<HTMLElement>("[data-pano-stage]");
  const plane = document.querySelector<HTMLElement>("[data-pano-plane]");
  if (!stage || !plane) return () => {};

  const allTiles = portfolio.socialPosts.items
    .filter((p) => !p.id.startsWith("_"))
    .map(tileFromPost);
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

  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let pointerId: number | null = null;
  let downTile: string | null = null;
  let interacted = reduced;

  const pool = new Map<string, HTMLElement>();
  let raf = 0;
  let running = false;

  function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
  }

  function buildCell(): HTMLElement {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "pano-tile";
    el.innerHTML = `
      <span class="pano-tile__head">
        <span class="pano-tile__client" data-client></span>
        <span class="pano-tile__name" data-name></span>
      </span>
      <span class="pano-tile__media">
        <img class="pano-tile__img" alt="" loading="lazy" decoding="async" draggable="false" />
      </span>
      <span class="pano-tile__foot">
        <span class="pano-tile__tags" data-tags></span>
        <span class="pano-tile__kind" data-kind></span>
      </span>`;
    plane!.appendChild(el);
    return el;
  }

  function fillCell(el: HTMLElement, tile: PanoTile): void {
    if (el.dataset.tileId === tile.id) return;
    el.dataset.tileId = tile.id;
    const img = el.querySelector<HTMLImageElement>(".pano-tile__img")!;
    img.src = tile.cover;
    img.alt = tile.alt;
    el.querySelector("[data-client]")!.textContent = tile.client;
    el.querySelector("[data-name]")!.textContent = tile.title;
    el.querySelector("[data-kind]")!.textContent = tile.kind;
    el.querySelector("[data-tags]")!.innerHTML = tile.tags
      .map((t) => `<span class="pano-tile__tag">${t}</span>`)
      .join("");
    el.setAttribute("aria-label", `${tile.title} — ${tile.client}. Open viewer.`);
  }

  function render(): void {
    const vw = stage!.clientWidth;
    const vh = stage!.clientHeight;
    const cx = vw / 2;
    const cy = vh / 2;
    const n = tiles.length;

    const colStart = Math.floor((ox - tileW) / cellW) - MARGIN;
    const colEnd = Math.ceil((ox + vw) / cellW) + MARGIN;
    const rowStart = Math.floor((oy - tileH) / cellH) - MARGIN;
    const rowEnd = Math.ceil((oy + vh) / cellH) + MARGIN;

    const seen = new Set<string>();
    // normalized curvature radius
    const maxR = Math.hypot(vw, vh) / 2 || 1;

    for (let r = rowStart; r <= rowEnd; r++) {
      for (let c = colStart; c <= colEnd; c++) {
        const key = `${c},${r}`;
        seen.add(key);
        let el = pool.get(key);
        if (!el) {
          el = buildCell();
          pool.set(key, el);
        }
        // Sheared indexing so rows don't line up into obvious vertical repeats.
        const idx = mod(r * (cols + 1) + c, n);
        fillCell(el, tiles[idx]);

        const sx = c * cellW - ox;
        const sy = r * cellH - oy;
        const tileCx = sx + tileW / 2;
        const tileCy = sy + tileH / 2;
        const nx = (tileCx - cx) / maxR;
        const ny = (tileCy - cy) / maxR;
        const dist = Math.min(1.25, Math.hypot(nx, ny));

        let transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
        if (!reduced) {
          const rotY = nx * 26;
          const rotX = -ny * 18;
          const tz = -(dist * dist) * 260;
          transform += ` rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) translateZ(${tz.toFixed(1)}px)`;
        }
        el.style.transform = transform;
        el.style.opacity = (1 - dist * 0.35).toFixed(3);
        el.style.zIndex = String(1000 - Math.round(dist * 1000));
      }
    }

    for (const [key, el] of pool) {
      if (!seen.has(key)) {
        el.remove();
        pool.delete(key);
      }
    }
  }

  function tick(): void {
    let needs = false;
    if (!dragging && (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05)) {
      ox += vx;
      oy += vy;
      vx *= 0.93;
      vy *= 0.93;
      needs = true;
    }
    if (!interacted && !reduced && !dragging) {
      ox += 0.22;
      oy += 0.06;
      needs = true;
    }
    if (needs) render();
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
    markInteracted();
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
    render();
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
    markInteracted();
    const horizontal = e.shiftKey;
    ox += horizontal ? e.deltaY : e.deltaX;
    oy += horizontal ? 0 : e.deltaY;
    vx = 0;
    vy = 0;
    render();
  }

  function markInteracted(): void {
    interacted = true;
  }

  function onResize(): void {
    ({ tileW, tileH, cols } = tileMetrics());
    cellW = tileW + GAP;
    cellH = tileH + GAP;
    stage!.style.setProperty("--tile-w", `${tileW}px`);
    stage!.style.setProperty("--tile-h", `${tileH}px`);
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
    pool.forEach((el) => el.remove());
    pool.clear();
    ox = 0;
    oy = 0;
    buildList();
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
  buildList();
  render();
  startLoop();

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
    viewHandlers.forEach(([b, h]) => b.removeEventListener("click", h));
    pool.forEach((el) => el.remove());
    pool.clear();
  };
}
