/* Chaos Studio — video-only hero with brand-motif dither + tracking HUD */
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
  const gctx = glyphs.getContext("2d", { alpha: true });

  const assets = new Map();
  let logoPath = null;
  let videoReel = null;
  let ready = false;
  let running = false;
  let visible = true;
  let raf = 0;
  let lastT = 0;

  let palette = PALETTES[0];
  let glyphPool = "mixed";
  let cellSize = 14;
  let ditherMix = 0.62;
  let sceneStart = 0;
  let sceneDuration = 5800;
  let sceneCutAt = 0;
  let transition = 0;
  let transitionDur = 480;
  let glitch = { rgb: 6, tear: 4 };
  let wipe = { dir: 1 };

  const size = { w: 0, h: 0, dpr: 1, sw: 0, sh: 0, gw: 0, gh: 0 };

  const pick = (a) => a[(Math.random() * a.length) | 0];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

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
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.1 : 1.35);
    size.w = Math.max(1, Math.floor(rect.width));
    size.h = Math.max(1, Math.floor(rect.height));
    size.dpr = dpr;
    size.sw = Math.max(1, Math.floor(size.w * (mobile ? 0.5 : 0.62)));
    size.sh = Math.max(1, Math.floor(size.h * (mobile ? 0.5 : 0.62)));
    canvas.width = Math.floor(size.w * dpr);
    canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = size.w + "px";
    canvas.style.height = size.h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    work.width = size.sw;
    work.height = size.sh;
    glyphs.width = size.sw;
    glyphs.height = size.sh;
    size.gw = Math.ceil(size.sw / cellSize);
    size.gh = Math.ceil(size.sh / cellSize);
    sample.width = size.gw;
    sample.height = size.gh;
  }

  function poolGlyphs(kind) {
    if (kind === "marks") return [...MARKS];
    if (kind === "shapes") return [...SHAPES];
    if (kind === "icons") return [...ICONS];
    if (kind === "logo") return logoPath ? ["logo"] : MARKS;
    return [...MARKS, ...SHAPES, ...ICONS];
  }

  function pickGlyph(gx, gy, pool) {
    if (pool[0] === "logo") return "logo";
    return pool[(gx + gy * 3 + sceneStart) % pool.length];
  }

  function drawGlyph(gx, gy, L, pool) {
    const cx = gx * cellSize + cellSize * 0.5;
    const cy = gy * cellSize + cellSize * 0.5;
    const t = L / 255;
    if (t < 0.22) return;
    const alpha = t * ditherMix;
    const col = t > 0.72 ? palette.fg : t > 0.45 ? palette.mid : palette.accent;
    const sc = cellSize * (0.38 + t * 0.55);
    const id = pickGlyph(gx, gy, pool);

    gctx.save();
    gctx.globalAlpha = alpha;
    gctx.translate(cx, cy);
    gctx.rotate(((gx - gy) % 5) * 0.08);
    if (id === "logo" && logoPath) {
      gctx.fillStyle = col;
      gctx.scale(sc / 245, sc / 245);
      gctx.translate(-122.5, -167);
      gctx.fill(logoPath);
    } else {
      const img = assets.get(id);
      if (!img) {
        gctx.restore();
        return;
      }
      const iw = img.naturalWidth || 64;
      const ih = img.naturalHeight || 64;
      gctx.drawImage(img, -sc / 2, -sc / 2, sc, sc);
      gctx.globalCompositeOperation = "source-in";
      gctx.fillStyle = col;
      gctx.fillRect(-sc / 2, -sc / 2, sc, sc);
    }
    gctx.restore();
  }

  function applyBrandDither() {
    const pool = poolGlyphs(glyphPool);
    sctx.drawImage(work, 0, 0, size.gw, size.gh);
    const data = sctx.getImageData(0, 0, size.gw, size.gh).data;
    gctx.clearRect(0, 0, size.sw, size.sh);
    for (let gy = 0; gy < size.gh; gy++) {
      for (let gx = 0; gx < size.gw; gx++) {
        const i = (gy * size.gw + gx) * 4;
        const L = lum(data[i], data[i + 1], data[i + 2]);
        drawGlyph(gx, gy, L, pool);
      }
    }
  }

  function newScene() {
    if (!videoReel || !videoReel.clips.length) return;
    const clip = videoReel.pickClip();
    palette = pick(PALETTES);
    if (Math.random() < 0.15) palette = { ...palette, fg: palette.bg, bg: palette.fg };
    glyphPool = pick(["mixed", "marks", "shapes", "logo", "icons"]);
    cellSize = mobile ? pick([10, 12, 14]) : pick([12, 14, 16, 18]);
    ditherMix = 0.48 + Math.random() * 0.38;
    sceneDuration = mobile ? 4600 + Math.random() * 1400 : 5200 + Math.random() * 1600;
    sceneCutAt = performance.now() + sceneDuration;
    sceneStart = performance.now();
    transition = 1;
    wipe.dir = Math.random() < 0.5 ? 1 : -1;
    glitch = { rgb: 5 + Math.random() * 10, tear: 2 + Math.random() * 6 };
    resize();
    videoReel.setScene(clip);
    pulseHeadline();
  }

  function pulseHeadline() {
    const h = document.querySelector(".hero-h");
    if (!h || RM) return;
    h.classList.add("hero-glitch-flash");
    setTimeout(() => h.classList.remove("hero-glitch-flash"), 360);
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

    const rawMix = 1 - ditherMix * 0.85;
    ctx.globalAlpha = rawMix;
    ctx.drawImage(work, 0, 0, size.w, size.h);
    ctx.globalAlpha = 1;
    ctx.drawImage(glyphs, 0, 0, size.w, size.h);

    if (videoReel) {
      videoReel.drawHud(ctx, size.w, size.h, palette, videoReel.active && videoReel.active.clip);
    }
    ctx.restore();

    if (tr > 0.05) {
      const shift = Math.floor(glitch.rgb * tr);
      if (shift > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(255,68,68,0.12)";
        ctx.fillRect(shift, 0, size.w, size.h);
        ctx.fillStyle = "rgba(193,107,224,0.09)";
        ctx.fillRect(-shift, 2, size.w, size.h);
        ctx.restore();
      }
      if (glitch.tear > 0) {
        const y = (performance.now() / 48) % size.h;
        ctx.fillStyle = palette.accent;
        ctx.globalAlpha = 0.22 * tr;
        ctx.fillRect(0, y, size.w, glitch.tear);
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = "rgba(0,0,0,0.045)";
    for (let y = 0; y < size.h; y += mobile ? 5 : 4) ctx.fillRect(0, y, size.w, 1);
  }

  function frame(t) {
    if (!ready) return;

    if (RM) {
      const c0 = videoReel && videoReel.clips[0];
      if (c0) videoReel.stillFrame(wctx, size.sw, size.sh, palette, c0);
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
    applyBrandDither();
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
      applyBrandDither();
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
