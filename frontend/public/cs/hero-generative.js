/* Video hero — heavy logo/motif glyph dither + ordered/Floyd crush + HUD */
(function () {
  const canvas = document.getElementById("hero-gen-canvas");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;

  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 520px), (hover: none)").matches;
  const LOGO = window.__LOGO_PATH__;

  const MARKS = [
    "/assets/motifs/marks/chaos-mark-a.svg",
    "/assets/motifs/marks/chaos-mark-b.svg",
    "/assets/motifs/marks/chaos-mark-c.svg",
    "/assets/motifs/marks/chaos-mark-d.svg",
    "/assets/motifs/marks/chaos-mark-e.svg",
  ];
  const SHAPES = [
    "/assets/motifs/shapes/chaos-shape-1.svg",
    "/assets/motifs/shapes/chaos-shape-2.svg",
    "/assets/motifs/shapes/chaos-shape-3.svg",
    "/assets/motifs/shapes/chaos-shape-4.svg",
    "/assets/motifs/shapes/chaos-shape-5.svg",
  ];
  const ICONS = [
    "/assets/motifs/dot-icons/dot-bolt.svg",
    "/assets/motifs/dot-icons/dot-target.svg",
    "/assets/motifs/dot-icons/dot-logo.svg",
    "/assets/motifs/dot-icons/dot-rocket.svg",
  ];
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  const PALETTES = [
    { id: "void", bg: "#0e0e0f", fg: "#ffffff", accent: "#ff4444", mid: "#c16be0" },
    { id: "ink", bg: "#1a1a1b", fg: "#ede6da", accent: "#ff4444", mid: "#28122c" },
    { id: "plum", bg: "#28122c", fg: "#ffffff", accent: "#ff4444", mid: "#d690e8" },
    { id: "purple", bg: "#0e0e0f", fg: "#c16be0", accent: "#ff4444", mid: "#1a1a1b" },
    { id: "paper", bg: "#ede6da", fg: "#1a1a1b", accent: "#ff4444", mid: "#a79a89" },
    { id: "lilac", bg: "#1a1a1b", fg: "#d690e8", accent: "#ffffff", mid: "#c16be0" },
    { id: "red", bg: "#1a1a1b", fg: "#ff4444", accent: "#ffffff", mid: "#c16be0" },
  ];

  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const work = document.createElement("canvas");
  const wctx = work.getContext("2d", { alpha: false, willReadFrequently: true });
  const sample = document.createElement("canvas");
  const sctx = sample.getContext("2d", { willReadFrequently: true });
  const glyphs = document.createElement("canvas");
  const gctx = glyphs.getContext("2d", { alpha: false, willReadFrequently: false });

  const assets = new Map();
  const atlas = new Map();
  let logoPath = null;
  let videoReel = null;
  let ready = false;
  let running = false;
  let visible = true;
  let raf = 0;
  let lastT = 0;
  let sceneIndex = 0;

  let palette = PALETTES[0];
  let glyphPool = "mixed";
  let cellSize = 16;
  let ditherMode = "bayer";
  let rawMix = 0.32;
  let glyphCrush = 0.42;
  let sceneStart = 0;
  let sceneDuration = 6200;
  let sceneCutAt = 0;
  let transition = 0;
  let transitionDur = 880;
  let glitch = { rgb: 8, tear: 5, slices: 4 };
  let wipe = { dir: 1 };

  const size = { w: 0, h: 0, dpr: 1, sw: 0, sh: 0, gw: 0, gh: 0 };

  const pick = (a) => a[(Math.random() * a.length) | 0];
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const rgb = (hex) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
  }

  async function preload() {
    await Promise.all(
      [...MARKS, ...SHAPES, ...ICONS].map(async (src) => {
        try {
          assets.set(src, await loadImage(src));
        } catch {
          /* */
        }
      }),
    );
    if (LOGO) logoPath = new Path2D(LOGO);
    ready = true;
  }

  function defaultCellSize() {
    return mobile ? 18 + ((Math.random() * 3) | 0) : 24 + ((Math.random() * 5) | 0);
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(Math.max(1, devicePixelRatio || 1), mobile ? 2 : 2.25);
    size.w = Math.max(1, Math.floor(rect.width));
    size.h = Math.max(1, Math.floor(rect.height));
    size.dpr = dpr;
    size.sw = Math.max(1, Math.floor(size.w * (mobile ? 0.72 : 0.78)));
    size.sh = Math.max(1, Math.floor(size.h * (mobile ? 0.72 : 0.78)));
    canvas.width = Math.floor(size.w * dpr);
    canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = size.w + "px";
    canvas.style.height = size.h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    work.width = size.sw;
    work.height = size.sh;
    glyphs.width = size.sw;
    glyphs.height = size.sh;
    size.gw = Math.max(1, Math.ceil(size.sw / cellSize));
    size.gh = Math.max(1, Math.ceil(size.sh / cellSize));
    sample.width = size.sw;
    sample.height = size.sh;
  }

  function poolGlyphs(kind) {
    if (kind === "marks") return [...MARKS];
    if (kind === "shapes") return [...SHAPES];
    if (kind === "icons") return [...ICONS];
    if (kind === "logo") return logoPath ? ["logo"] : MARKS;
    return [...MARKS, ...SHAPES, ...ICONS, ...(logoPath ? ["logo"] : [])];
  }

  function pickGlyphId(gx, gy, L, pool) {
    if (pool.length === 1 && pool[0] === "logo") return "logo";
  let band;
    if (L >= 205) band = logoPath ? ["logo", MARKS[0], MARKS[2], MARKS[4]] : [MARKS[0], MARKS[2], ICONS[2]];
    else if (L >= 168) band = [MARKS[0], MARKS[1], MARKS[2], MARKS[3], MARKS[4]];
    else if (L >= 128) band = [...SHAPES, MARKS[1], MARKS[3]];
    else if (L >= 88) band = [...ICONS, SHAPES[2], SHAPES[4]];
    else band = pool;
    const idx = (gx * 7 + gy * 11 + sceneIndex * 3 + ((L / 12) | 0)) % band.length;
    return band[idx];
  }

  function glyphColor(L) {
    if (L >= 200) return palette.fg;
    if (L >= 155) return palette.mid;
    return palette.fg;
  }

  function glyphAtlasKey(id, color) {
    return `${id}|${color}`;
  }

  function getAtlasStamp(id, color) {
    const key = glyphAtlasKey(id, color);
    if (atlas.has(key)) return atlas.get(key);
    const logical = Math.max(32, Math.round(cellSize * (mobile ? 3.25 : 3.1)));
    const dprA = Math.min(2, size.dpr || 1);
    const c = document.createElement("canvas");
    c.width = Math.round(logical * dprA);
    c.height = Math.round(logical * dprA);
    const cx = c.getContext("2d");
    cx.setTransform(dprA, 0, 0, dprA, 0, 0);
    cx.clearRect(0, 0, logical, logical);
    cx.imageSmoothingEnabled = true;
    if (id === "logo" && logoPath) {
      const pad = logical * 0.08;
      const sc = (logical - pad * 2) / 245;
      cx.fillStyle = color;
      cx.translate(pad + (logical - pad * 2) / 2, pad + (logical - pad * 2) / 2);
      cx.scale(sc, sc);
      cx.translate(-122.5, -167);
      cx.fill(logoPath);
    } else {
      const img = assets.get(id);
      if (img) {
        const pad = logical * 0.06;
        cx.drawImage(img, pad, pad, logical - pad * 2, logical - pad * 2);
        cx.globalCompositeOperation = "source-in";
        cx.fillStyle = color;
        cx.fillRect(0, 0, logical, logical);
      }
    }
    atlas.set(key, c);
    if (atlas.size > 96) {
      const first = atlas.keys().next().value;
      atlas.delete(first);
    }
    return c;
  }

  /** Box-average luma per glyph cell (avoids row downsample banding). */
  function sampleCellLuma(src) {
    const w = size.sw;
    const h = size.sh;
    const data = src.data;
    const grid = new Float32Array(size.gw * size.gh * 3);
    const cs = cellSize;

    for (let gy = 0; gy < size.gh; gy++) {
      const y0 = gy * cs;
      const y1 = Math.min(h, y0 + cs);
      for (let gx = 0; gx < size.gw; gx++) {
        const x0 = gx * cs;
        const x1 = Math.min(w, x0 + cs);
        let rs = 0;
        let gs = 0;
        let bs = 0;
        let n = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * w + x) * 4;
            rs += data[i];
            gs += data[i + 1];
            bs += data[i + 2];
            n++;
          }
        }
        const k = gy * size.gw + gx;
        if (n) {
          grid[k * 3] = rs / n;
          grid[k * 3 + 1] = gs / n;
          grid[k * 3 + 2] = bs / n;
        }
      }
    }
    return grid;
  }

  function crushPixels() {
    const img = wctx.getImageData(0, 0, size.sw, size.sh);
    const data = img.data;
    const w = size.sw;
    const h = size.sh;
    const bg = rgb(palette.bg);
    const fg = rgb(palette.fg);
    const ac = rgb(palette.accent);
    const mid = rgb(palette.mid);
    const keep = mobile ? Math.max(rawMix, 0.38) : rawMix;
    const cell = cellSize;

    if (ditherMode === "floyd" && !mobile && w * h < 500000) {
      const L = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          L[y * w + x] = lum(data[i], data[i + 1], data[i + 2]);
        }
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const old = L[idx];
          const nv = old > 118 ? 255 : 0;
          const err = old - nv;
          L[idx] = nv;
          const sp = (dx, dy, f) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) L[ny * w + nx] += err * f;
          };
          sp(1, 0, 7 / 16);
          sp(-1, 1, 3 / 16);
          sp(0, 1, 5 / 16);
          sp(1, 1, 1 / 16);
        }
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const on = L[y * w + x] > 128;
          const shock = on && (x + y + sceneIndex) % 19 === 0;
          const c = shock ? ac : on ? (x % 7 === 0 ? mid : fg) : bg;
          data[i] = data[i] * keep + c[0] * (1 - keep);
          data[i + 1] = data[i + 1] * keep + c[1] * (1 - keep);
          data[i + 2] = data[i + 2] * keep + c[2] * (1 - keep);
        }
      }
    } else {
      for (let gy = 0; gy < size.gh; gy++) {
        for (let gx = 0; gx < size.gw; gx++) {
          const y0 = gy * cell;
          const y1 = Math.min(h, y0 + cell);
          const x0 = gx * cell;
          const x1 = Math.min(w, x0 + cell);
          let Ls = 0;
          let n = 0;
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = (y * w + x) * 4;
              Ls += lum(data[i], data[i + 1], data[i + 2]);
              n++;
            }
          }
          const L = n ? Ls / n : 0;
          const t = (B4[(gy & 3) * 4 + (gx & 3)] + 0.5) / 16;
          const on = L / 255 > t - 0.08;
          const shock = on && L > 198 && (gx + gy + sceneIndex) % 13 === 0;
          const c = shock ? ac : on ? (L > 180 ? mid : fg) : bg;
          const blend = on ? (1 - keep) * (mobile ? 0.55 : 0.72) : (1 - keep) * 0.35;
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = (y * w + x) * 4;
              data[i] = data[i] * keep + c[0] * blend;
              data[i + 1] = data[i + 1] * keep + c[1] * blend;
              data[i + 2] = data[i + 2] * keep + c[2] * blend;
            }
          }
        }
      }
    }
    wctx.putImageData(img, 0, 0);
  }

  function buildGlyphField(lumaGrid) {
    const pool = poolGlyphs(glyphPool);
    gctx.clearRect(0, 0, size.sw, size.sh);
    const stamp = Math.max(14, cellSize - (mobile ? 1 : 2));
    const pad = (cellSize - stamp) / 2;

    for (let gy = 0; gy < size.gh; gy++) {
      for (let gx = 0; gx < size.gw; gx++) {
        const k = gy * size.gw + gx;
        const r = lumaGrid[k * 3];
        const g = lumaGrid[k * 3 + 1];
        const b = lumaGrid[k * 3 + 2];
        const L = lum(r, g, b);
        const bx = gx * cellSize;
        const by = gy * cellSize;
        const t = (B4[(gy & 3) * 4 + (gx & 3)] + 0.5) / 16;
        const on = L / 255 > t - 0.06;

        if (!on) continue;

        const shock = L > 200 && (gx + gy) % 11 === 0;
        const col = shock ? palette.accent : glyphColor(L);
        const id = pickGlyphId(gx, gy, L, pool);
        const tile = getAtlasStamp(id, col);
        gctx.drawImage(tile, bx + pad, by + pad, stamp, stamp);
      }
    }
  }

  function applyHeavyDither() {
    const src = wctx.getImageData(0, 0, size.sw, size.sh);
    const lumaGrid = sampleCellLuma(src);
    if (!mobile) crushPixels();
    buildGlyphField(lumaGrid);
    wctx.globalAlpha = glyphCrush;
    wctx.globalCompositeOperation = "source-over";
    wctx.drawImage(glyphs, 0, 0);
    wctx.globalAlpha = 1;
  }

  function refreshScenePalette() {
    if (!videoReel || !videoReel.clips.length) return;
    palette = pick(PALETTES);
    glyphPool = pick(["mixed", "marks", "shapes", "icons", "logo"]);
    cellSize = defaultCellSize();
    ditherMode = mobile ? "bayer" : pick(["bayer", "bayer", "floyd"]);
    rawMix = 0.28 + Math.random() * 0.1;
    glyphCrush = mobile ? 0.5 + Math.random() * 0.12 : 0.44 + Math.random() * 0.12;
    sceneStart = performance.now();
    sceneIndex++;
    transition = 0.35;
    glitch = { rgb: 3 + Math.random() * 4, tear: 1 + Math.random() * 3, slices: 1 + ((Math.random() * 2) | 0) };
    resize();
    atlas.clear();
  }

  function newScene() {
    refreshScenePalette();
  }

  function composite() {
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, size.w, size.h);

    const blend = videoReel && videoReel.getBlendMix ? videoReel.getBlendMix() : 0;
    const tr = Math.max(transition * 0.35, blend * 0.22);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(work, 0, 0, size.w, size.h);
    ctx.imageSmoothingEnabled = true;

    if (videoReel) {
      videoReel.drawHud(ctx, size.w, size.h, palette);
    }

    if (tr > 0.06) {
      const g = glitch;
      const shift = Math.floor(g.rgb * tr * 0.6);
      if (shift) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(193,107,224,0.07)";
        ctx.fillRect(shift, 0, size.w, size.h);
        ctx.restore();
      }
    }

    if (!mobile) {
      ctx.fillStyle = "rgba(0,0,0,0.018)";
      for (let y = 0; y < size.h; y += 4) ctx.fillRect(0, y, size.w, 1);
    }
  }

  function frame(t) {
    if (!ready) return;

    if (RM) {
      const c0 = videoReel && videoReel.clips[0];
      if (c0) videoReel.stillFrame(wctx, size.sw, size.sh, palette, c0);
      applyHeavyDither();
      composite();
      return;
    }

    if (!running || !visible || document.hidden) return;
    const dt = Math.min(32, t - (lastT || t));
    lastT = t;

    if (videoReel) {
      videoReel.tickPoster && videoReel.tickPoster(dt);
      const mix = videoReel.getBlendMix ? videoReel.getBlendMix() : 0;
      if (mix > 0.12 && transition < 0.5) refreshScenePalette();
      if (transition > 0) transition = Math.max(0, transition - dt / transitionDur);
      videoReel.drawVideo(wctx, size.sw, size.sh, palette);
    }
    else {
      wctx.fillStyle = palette.bg;
      wctx.fillRect(0, 0, size.sw, size.sh);
    }
    applyHeavyDither();
    composite();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastT = 0;
    if (!sceneStart) refreshScenePalette();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    videoReel && videoReel.pauseAll();
  }

  const io = new IntersectionObserver(
    (entries) => {
      const on = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.04) && !document.hidden;
      visible = on;
      if (visible && !RM) start();
      else stop();
    },
    { threshold: [0, 0.04, 0.1], rootMargin: "0px 0px -8% 0px" },
  );

  async function init() {
    resize();
    await preload();
    if (window.HeroVideoReel) {
      try {
        const manifest = await window.HeroVideoReel.loadManifest();
        videoReel = window.HeroVideoReel.createState({ hero, mobile, reduced: RM });
        await videoReel.prepareFirst(manifest.clips);
      } catch {
        videoReel = null;
      }
    }
    palette = PALETTES[0];
    if (RM && videoReel && videoReel.clips[0]) {
      videoReel.stillFrame(wctx, size.sw, size.sh, palette, videoReel.clips[0]);
      applyHeavyDither();
      composite();
      return;
    }
    io.observe(hero);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (visible) start();
    });
    addEventListener("resize", resize, { passive: true });
    start();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
