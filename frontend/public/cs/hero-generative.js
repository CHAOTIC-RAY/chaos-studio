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
  let cellSize = 10;
  let ditherMode = "bayer";
  let rawMix = 0.04;
  let glyphCrush = 0.97;
  let sceneStart = 0;
  let sceneDuration = 5600;
  let sceneCutAt = 0;
  let transition = 0;
  let transitionDur = 520;
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

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.08 : 1.3);
    size.w = Math.max(1, Math.floor(rect.width));
    size.h = Math.max(1, Math.floor(rect.height));
    size.dpr = dpr;
    size.sw = Math.max(1, Math.floor(size.w * (mobile ? 0.48 : 0.58)));
    size.sh = Math.max(1, Math.floor(size.h * (mobile ? 0.48 : 0.58)));
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
    sample.width = size.gw;
    sample.height = size.gh;
  }

  function poolGlyphs(kind) {
    if (kind === "marks") return [...MARKS];
    if (kind === "shapes") return [...SHAPES];
    if (kind === "icons") return [...ICONS];
    if (kind === "logo") return logoPath ? ["logo"] : MARKS;
    return [...MARKS, ...SHAPES, ...ICONS, ...(logoPath ? ["logo"] : [])];
  }

  function pickGlyphId(gx, gy, pool) {
    if (pool.length === 1 && pool[0] === "logo") return "logo";
    const idx = (gx * 7 + gy * 11 + sceneIndex * 3) % pool.length;
    return pool[idx];
  }

  function glyphAtlasKey(id, color) {
    return `${id}|${color}`;
  }

  function getAtlasStamp(id, color, stamp) {
    const key = glyphAtlasKey(id, color);
    if (atlas.has(key)) return atlas.get(key);
    const c = document.createElement("canvas");
    const n = mobile ? 20 : 28;
    c.width = n;
    c.height = n;
    const cx = c.getContext("2d");
    cx.clearRect(0, 0, n, n);
    if (id === "logo" && logoPath) {
      cx.fillStyle = color;
      cx.scale(n / 245, n / 245);
      cx.translate(-122.5, -167);
      cx.fill(logoPath);
    } else {
      const img = assets.get(id);
      if (img) {
        cx.drawImage(img, 0, 0, n, n);
        cx.globalCompositeOperation = "source-in";
        cx.fillStyle = color;
        cx.fillRect(0, 0, n, n);
      }
    }
    atlas.set(key, c);
    if (atlas.size > 48) atlas.clear();
    return c;
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
    const keep = rawMix;

    if (ditherMode === "floyd" && w * h < (mobile ? 220000 : 500000)) {
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
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const L = lum(data[i], data[i + 1], data[i + 2]);
          const t = (B4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
          const on = L / 255 > t - 0.1;
          const shock = on && (x + y * 3 + sceneIndex) % 11 === 0;
          const c = shock ? ac : on ? (L > 190 && x % 6 === 0 ? mid : fg) : bg;
          data[i] = data[i] * keep + c[0] * (1 - keep);
          data[i + 1] = data[i + 1] * keep + c[1] * (1 - keep);
          data[i + 2] = data[i + 2] * keep + c[2] * (1 - keep);
        }
      }
    }
    wctx.putImageData(img, 0, 0);
  }

  function buildGlyphField(luma) {
    const pool = poolGlyphs(glyphPool);
    gctx.fillStyle = palette.bg;
    gctx.fillRect(0, 0, size.sw, size.sh);
    const stamp = cellSize * (mobile ? 0.94 : 0.96);

    for (let gy = 0; gy < size.gh; gy++) {
      for (let gx = 0; gx < size.gw; gx++) {
        const i = (gy * size.gw + gx) * 4;
        const L = lum(luma[i], luma[i + 1], luma[i + 2]);
        const bx = gx * cellSize;
        const by = gy * cellSize;
        const t = B4[(gy & 3) * 4 + (gx & 3)] / 16;
        const on = L > 98 - t * 22;

        if (!on) {
          if (glyphCrush > 0.8) {
            gctx.fillStyle = palette.bg;
            gctx.fillRect(bx, by, cellSize, cellSize);
          }
          continue;
        }

        const shock = L > 200 && (gx + gy) % 9 === 0;
        const col = shock ? palette.accent : L > 175 ? palette.fg : palette.mid;
        const id = pickGlyphId(gx, gy, pool);
        const tile = getAtlasStamp(id, col, stamp);
        gctx.drawImage(tile, bx + (cellSize - stamp) / 2, by + (cellSize - stamp) / 2, stamp, stamp);
      }
    }
  }

  function applyHeavyDither() {
    sctx.drawImage(work, 0, 0, size.gw, size.gh);
    const sampleData = sctx.getImageData(0, 0, size.gw, size.gh).data;
    crushPixels();
    buildGlyphField(sampleData);
    wctx.globalAlpha = glyphCrush;
    wctx.globalCompositeOperation = "source-over";
    wctx.drawImage(glyphs, 0, 0);
    wctx.globalAlpha = 1;
  }

  function newScene() {
    if (!videoReel || !videoReel.clips.length) return;
    const clip = videoReel.pickClip();
    palette = pick(PALETTES);
    if (Math.random() < 0.12) palette = { ...palette, fg: palette.bg, bg: palette.fg };
    glyphPool = pick(["mixed", "marks", "shapes", "logo", "icons", "logo"]);
    cellSize = mobile ? pick([10, 11, 12]) : pick([11, 12, 13, 14]);
    ditherMode = mobile ? "bayer" : pick(["bayer", "bayer", "floyd"]);
    rawMix = mobile ? 0.02 + Math.random() * 0.04 : 0.03 + Math.random() * 0.05;
    glyphCrush = 0.94 + Math.random() * 0.05;
    sceneDuration = mobile ? 4800 + Math.random() * 1200 : 5400 + Math.random() * 1400;
    sceneCutAt = performance.now() + sceneDuration;
    sceneStart = performance.now();
    sceneIndex++;
    transition = 1;
    wipe.dir = Math.random() < 0.5 ? 1 : -1;
    glitch = { rgb: 8 + Math.random() * 14, tear: 3 + Math.random() * 8, slices: 3 + ((Math.random() * 4) | 0) };
    resize();
    atlas.clear();
    videoReel.setScene(clip);
    pulseHeadline();
  }

  function pulseHeadline() {
    const h = document.querySelector(".hero-h");
    if (!h || RM) return;
    h.classList.add("hero-glitch-flash");
    setTimeout(() => h.classList.remove("hero-glitch-flash"), 360);
  }

  function drawLogoFlash(a) {
    if (!logoPath || a < 0.05) return;
    ctx.save();
    ctx.globalAlpha = a * 0.45;
    ctx.fillStyle = palette.mid;
    const sc = Math.min(size.w, size.h) * 0.38;
    ctx.translate(size.w * 0.5, size.h * 0.46);
    ctx.scale(sc / 245, sc / 245);
    ctx.translate(-122.5, -167);
    ctx.fill(logoPath);
    ctx.restore();
  }

  function composite() {
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, size.w, size.h);

    const tr = transition;
    ctx.save();
    if (tr > 0.02) {
      const wx = size.w * (1 - tr);
      ctx.beginPath();
      if (wipe.dir > 0) ctx.rect(0, 0, wx, size.h);
      else ctx.rect(size.w - wx, 0, wx, size.h);
      ctx.clip();
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(work, 0, 0, size.w, size.h);
    ctx.imageSmoothingEnabled = true;

    if (videoReel) {
      videoReel.drawHud(ctx, size.w, size.h, palette, videoReel.active && videoReel.active.clip);
    }
    ctx.restore();

    if (tr > 0.08) drawLogoFlash(tr);

    if (tr > 0.04) {
      const g = glitch;
      const shift = Math.floor(g.rgb * tr);
      if (shift) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(255,68,68,0.16)";
        ctx.fillRect(shift, 0, size.w, size.h);
        ctx.fillStyle = "rgba(193,107,224,0.12)";
        ctx.fillRect(-shift, 2, size.w, size.h);
        ctx.restore();
      }
      for (let s = 0; s < g.slices; s++) {
        const y = ((performance.now() / 40 + s * 47) | 0) % size.h;
        const h = 6 + (s % 3) * 4;
        ctx.fillStyle = s % 2 ? palette.mid : palette.accent;
        ctx.globalAlpha = 0.2 * tr;
        ctx.fillRect(-shift + s * 3, y, size.w, h);
      }
      ctx.globalAlpha = 1;
      if (g.tear > 0) {
        const y = (performance.now() / 45) % size.h;
        ctx.fillStyle = palette.accent;
        ctx.globalAlpha = 0.28 * tr;
        ctx.fillRect(0, y, size.w, g.tear);
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = "rgba(0,0,0,0.055)";
    for (let y = 0; y < size.h; y += mobile ? 4 : 3) ctx.fillRect(0, y, size.w, 1);
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

    if (t >= sceneCutAt) newScene();
    if (transition > 0) transition = Math.max(0, transition - dt / transitionDur);

    if (videoReel) videoReel.drawVideo(wctx, size.sw, size.sh, palette);
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
    if (!sceneCutAt) newScene();
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
