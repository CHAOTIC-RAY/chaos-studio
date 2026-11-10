/* Chaos Studio — generative hero reel (motifs + logo, motion-design loop). */
(function () {
  const canvas = document.getElementById("hero-gen-canvas");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;

  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 520px), (hover: none)").matches;
  const LOGO = window.__LOGO_PATH__;
  const BPM = mobile ? 96 : 108;
  const BEAT = 60000 / BPM;

  const MARKS = ["/assets/motifs/marks/chaos-mark-a.svg", "/assets/motifs/marks/chaos-mark-b.svg", "/assets/motifs/marks/chaos-mark-c.svg", "/assets/motifs/marks/chaos-mark-d.svg", "/assets/motifs/marks/chaos-mark-e.svg"];
  const SHAPES = ["/assets/motifs/shapes/chaos-shape-1.svg", "/assets/motifs/shapes/chaos-shape-2.svg", "/assets/motifs/shapes/chaos-shape-3.svg", "/assets/motifs/shapes/chaos-shape-4.svg", "/assets/motifs/shapes/chaos-shape-5.svg"];
  const ICONS = ["/assets/motifs/dot-icons/dot-bolt.svg", "/assets/motifs/dot-icons/dot-target.svg", "/assets/motifs/dot-icons/dot-star.svg", "/assets/motifs/dot-icons/dot-logo.svg", "/assets/motifs/dot-icons/dot-hashtag.svg", "/assets/motifs/dot-icons/dot-rocket.svg"];
  const NUMERALS = Array.from({ length: 10 }, (_, i) => `/assets/motifs/dot-numerals/dot-numeral-${i}.svg`);

  const PALETTES = [
    { bg: "#0e0e0f", fg: "#ffffff", accent: "#ff4444", mid: "#c16be0" },
    { bg: "#1a1a1b", fg: "#ede6da", accent: "#ff4444", mid: "#28122c" },
    { bg: "#28122c", fg: "#ffffff", accent: "#ff4444", mid: "#d690e8" },
    { bg: "#0e0e0f", fg: "#c16be0", accent: "#ff4444", mid: "#1a1a1b" },
    { bg: "#ede6da", fg: "#1a1a1b", accent: "#ff4444", mid: "#a79a89" },
    { bg: "#ffffff", fg: "#0e0e0f", accent: "#ff4444", mid: "#c16be0" },
    { bg: "#1a1a1b", fg: "#ff4444", accent: "#ffffff", mid: "#d690e8" },
  ];

  const DITHER_WEIGHTED = ["bayer", "bayer", "halftone", "halftone", "floyd", "threshold", "dotmatrix"];
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const LAYOUTS = ["orbit", "grid", "diagonal", "logo-focus"];

  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  const work = document.createElement("canvas");
  const wctx = work.getContext("2d", { alpha: false, willReadFrequently: true });
  let logoPath = null;
  const assets = new Map();

  let ready = false;
  let running = false;
  let visible = true;
  let raf = 0;
  let lastT = 0;
  let lastBeat = -1;
  let sceneIndex = 0;
  let sceneStart = 0;
  let sceneDuration = 5600;
  let sceneCutAt = 0;
  let transition = 0;
  let transitionDur = 520;
  let wipe = { dir: 1, t: 0 };
  let palette = PALETTES[0];
  let dither = "bayer";
  let ditherMix = 0.55;
  let glitch = { rgb: 0, tear: 0, blocks: 0, skip: false };
  let sprites = [];
  let layout = "orbit";
  let size = { w: 0, h: 0, dpr: 1, sw: 0, sh: 0 };

  const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

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
    const urls = [...MARKS, ...SHAPES, ...ICONS, ...NUMERALS];
    await Promise.all(
      urls.map(async (src) => {
        try {
          assets.set(src, await loadImage(src));
        } catch {
          /* optional asset */
        }
      }),
    );
    if (LOGO) logoPath = new Path2D(LOGO);
    ready = true;
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    size.w = Math.max(1, Math.floor(rect.width));
    size.h = Math.max(1, Math.floor(rect.height));
    size.dpr = dpr;
    size.sw = Math.max(1, Math.floor(size.w * (mobile ? 0.58 : 0.78)));
    size.sh = Math.max(1, Math.floor(size.h * (mobile ? 0.58 : 0.78)));
    canvas.width = Math.floor(size.w * dpr);
    canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = size.w + "px";
    canvas.style.height = size.h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    work.width = size.sw;
    work.height = size.sh;
  }

  function layoutPoint(i, n, kind) {
    const u = i / Math.max(1, n - 1);
    if (kind === "orbit") {
      const a = u * Math.PI * 2 - Math.PI / 2;
      const r = 0.22 + (i % 3) * 0.08;
      return { x: 0.5 + Math.cos(a) * r, y: 0.48 + Math.sin(a) * r * 0.82 };
    }
    if (kind === "grid") {
      const cols = mobile ? 2 : 3;
      const col = i % cols;
      const row = (i / cols) | 0;
      return { x: 0.22 + (col / (cols - 1 || 1)) * 0.56, y: 0.22 + row * 0.22 };
    }
    if (kind === "logo-focus") {
      if (i === 0) return { x: 0.5, y: 0.46 };
      const a = (i / n) * Math.PI * 2;
      return { x: 0.5 + Math.cos(a) * 0.32, y: 0.46 + Math.sin(a) * 0.28 };
    }
    return { x: 0.14 + u * 0.72, y: 0.18 + ((i * 0.17) % 0.62) };
  }

  function pickSrc(i, n) {
    if (layout === "logo-focus" && i === 0) return "logo";
    const r = Math.random();
    if (r < 0.22) return pick(MARKS);
    if (r < 0.45) return pick(SHAPES);
    if (r < 0.65) return pick(ICONS);
    if (r < 0.82) return pick(NUMERALS);
    return i % 4 === 0 ? "logo" : pick(SHAPES);
  }

  function newScene() {
    palette = pick(PALETTES);
    if (Math.random() < 0.18) palette = { ...palette, bg: palette.fg, fg: palette.bg };
    dither = mobile ? pick(["bayer", "halftone", "threshold"]) : pick(DITHER_WEIGHTED);
    ditherMix = 0.38 + Math.random() * 0.35;
    layout = pick(LAYOUTS);
    sceneDuration = mobile ? 4400 + Math.random() * 1400 : 5200 + Math.random() * 1800;
    sceneCutAt = performance.now() + sceneDuration;
    const count = mobile ? 5 + ((Math.random() * 2) | 0) : 7 + ((Math.random() * 4) | 0);
    sprites = [];
    for (let i = 0; i < count; i++) {
      const from = layoutPoint(i, count, layout);
      const wobble = { x: (Math.random() - 0.5) * 0.05, y: (Math.random() - 0.5) * 0.04 };
      const to = layoutPoint((i + 1) % count, count, layout);
      sprites.push({
        src: pickSrc(i, count),
        from,
        to: { x: clamp(from.x + wobble.x, 0.08, 0.92), y: clamp(from.y + wobble.y, 0.08, 0.9) },
        morph: { x: to.x, y: to.y },
        delay: i * (mobile ? 90 : 70),
        enter: 680 + Math.random() * 220,
        holdSpin: (Math.random() - 0.5) * 0.35,
        scale0: layout === "logo-focus" && i === 0 ? 0.05 : 0.12 + Math.random() * 0.08,
        scale1: layout === "logo-focus" && i === 0 ? 0.42 : 0.18 + Math.random() * 0.38,
        rot0: (Math.random() - 0.5) * Math.PI * 0.8,
        rot1: (Math.random() - 0.5) * Math.PI * 0.4,
        shock: Math.random() < 0.12,
        colorAlt: Math.random() < 0.45,
      });
    }
    glitch = {
      rgb: 4 + Math.random() * (mobile ? 5 : 10),
      tear: Math.random() < 0.65 ? 2 + Math.random() * 6 : 0,
      blocks: Math.random() < 0.45 ? 3 + ((Math.random() * 5) | 0) : 0,
      skip: Math.random() < 0.12,
    };
    transition = 1;
    wipe = { dir: Math.random() < 0.5 ? 1 : -1, t: 0 };
    sceneStart = performance.now();
    sceneIndex++;
    pulseHeadline("cut");
  }

  function pulseHeadline(reason) {
    const h = document.querySelector(".hero-h");
    const hl = document.querySelector(".hero .headline");
    if (!h || RM) return;
    if (reason === "cut") {
      h.classList.add("hero-glitch-flash");
      setTimeout(() => h.classList.remove("hero-glitch-flash"), 380);
    }
    const el = reason === "beat" ? h : hl;
    if (!el) return;
    el.classList.remove("hero-beat-punch");
    void el.offsetWidth;
    el.classList.add("hero-beat-punch");
    setTimeout(() => el.classList.remove("hero-beat-punch"), 220);
  }

  function beatIndex(t) {
    return Math.floor((t - sceneStart) / BEAT);
  }

  function beatPulse(t) {
    const b = beatIndex(t);
    if (b !== lastBeat) {
      lastBeat = b;
      if (b > 0 && b % 2 === 0) pulseHeadline("beat");
    }
  }

  function springMorph(a, b, m, u) {
    const e = easeOutCubic(u);
    return {
      x: a.x + (b.x - a.x) * e + (m.x - b.x) * e * 0.35,
      y: a.y + (b.y - a.y) * e + (m.y - b.y) * e * 0.35,
    };
  }

  function drawKineticGhost(elapsed) {
    if (RM || mobile) return;
    const intro = clamp(elapsed / 900, 0, 1);
  if (intro <= 0) return;
    const words = ["chaos", "studio"];
    wctx.save();
    wctx.globalAlpha = 0.07 * easeOutCubic(intro);
    wctx.fillStyle = palette.mid;
    wctx.font = `800 ${Math.floor(size.sh * 0.22)}px Syne, sans-serif`;
    wctx.textAlign = "center";
    words.forEach((w, i) => {
      const y = size.sh * (0.34 + i * 0.2);
      const wipeW = size.sw * easeOutBack(intro);
      wctx.save();
      wctx.beginPath();
      wctx.rect(size.sw * 0.5 - wipeW / 2, y - size.sh * 0.12, wipeW, size.sh * 0.16);
      wctx.clip();
      wctx.fillText(w, size.sw * 0.5, y);
      wctx.restore();
    });
    wctx.restore();
  }

  function drawSprites(t) {
    const elapsed = t - sceneStart;
    const build = clamp(elapsed / (sceneDuration * 0.75), 0, 1);
    const punch = 1 + (beatIndex(t) % 4 === 0 ? 0.06 : 0) * Math.sin(((t - sceneStart) % BEAT) / BEAT * Math.PI);

    wctx.fillStyle = palette.bg;
    wctx.fillRect(0, 0, size.sw, size.sh);
    drawKineticGhost(elapsed);

    const sceneBeat = clamp(elapsed / 520, 0, 1);
    ditherMix = clamp(0.32 + sceneBeat * 0.45 + transition * 0.25, 0.25, 0.92);

    for (const s of sprites) {
      const local = elapsed - s.delay;
      if (local < 0) continue;
      const enter = clamp(local / s.enter, 0, 1);
      const eased = easeOutBack(enter);
      const pos = springMorph(s.from, s.to, s.morph, build);
      const x = pos.x * size.sw;
      const y = pos.y * size.sh;
      const sc = (s.scale0 + (s.scale1 - s.scale0) * eased) * punch;
      const rot = s.rot0 + (s.rot1 - s.rot0) * eased + s.holdSpin * build * Math.PI * 2;
      const col = s.shock ? palette.accent : s.colorAlt ? palette.mid : palette.fg;

      wctx.save();
      wctx.translate(x, y);
      wctx.rotate(rot);
      wctx.scale(sc, sc);
      if (s.src === "logo" && logoPath) {
        wctx.fillStyle = col;
        wctx.scale(0.11, 0.11);
        wctx.translate(-122.5, -167);
        wctx.fill(logoPath);
      } else {
        const img = assets.get(s.src);
        if (!img) {
          wctx.restore();
          continue;
        }
        const iw = img.naturalWidth || 64;
        const ih = img.naturalHeight || 64;
        wctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
        wctx.globalCompositeOperation = "source-in";
        wctx.fillStyle = col;
        wctx.fillRect(-iw / 2, -ih / 2, iw, ih);
        wctx.globalCompositeOperation = "source-over";
      }
      wctx.restore();
    }
  }

  function luminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function rgb(hex) {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function applyDither(img) {
    const { data, width: w, height: h } = img;
    const bg = rgb(palette.bg);
    const fg = rgb(palette.fg);
    const ac = rgb(palette.accent);
    const mix = ditherMix;

    if (dither === "floyd" && !mobile) {
      const lum = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          lum[y * w + x] = luminance(data[i], data[i + 1], data[i + 2]);
        }
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const old = lum[idx];
          const nv = old > 140 ? 255 : 0;
          const err = old - nv;
          lum[idx] = nv;
          const spread = (dx, dy, f) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) lum[ny * w + nx] += err * f;
          };
          spread(1, 0, 7 / 16);
          spread(-1, 1, 3 / 16);
          spread(0, 1, 5 / 16);
          spread(1, 1, 1 / 16);
        }
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const on = lum[y * w + x] > 128;
          const shock = !on && (x + y + sceneIndex) % 23 === 0;
          const c = shock ? ac : on ? fg : bg;
          data[i] = data[i] * (1 - mix) + c[0] * mix;
          data[i + 1] = data[i + 1] * (1 - mix) + c[1] * mix;
          data[i + 2] = data[i + 2] * (1 - mix) + c[2] * mix;
        }
      }
      return;
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const L = luminance(data[i], data[i + 1], data[i + 2]);
        let on = false;
        if (dither === "threshold") on = L > 132;
        else if (dither === "halftone") {
          const r = Math.hypot(x - w * 0.5, y - h * 0.5);
          on = L > 104 + Math.sin(r * 0.2) * 26;
        } else if (dither === "dotmatrix") {
          on = L > 116 && (x + y) % 4 === 0;
        } else {
          const t = (B4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
          on = L / 255 > t;
        }
        const shock = !on && (x + y * 5) % 29 === 0;
        const c = shock ? ac : on ? fg : bg;
        data[i] = data[i] * (1 - mix) + c[0] * mix;
        data[i + 1] = data[i + 1] * (1 - mix) + c[1] * mix;
        data[i + 2] = data[i + 2] * (1 - mix) + c[2] * mix;
      }
    }
  }

  function blitWithGlitch() {
    const tr = transition;
    ctx.imageSmoothingEnabled = true;
    ctx.save();
    if (tr > 0.01) {
      const wx = size.w * (1 - tr);
      ctx.beginPath();
      if (wipe.dir > 0) ctx.rect(0, 0, wx, size.h);
      else ctx.rect(size.w - wx, 0, wx, size.h);
      ctx.clip();
    }
    ctx.drawImage(work, 0, 0, size.w, size.h);
    ctx.restore();

    if (tr > 0.05) {
      const g = glitch;
      const shift = Math.floor(g.rgb * tr);
      if (shift > 0) {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(255,68,68,0.1)";
        ctx.fillRect(shift, 0, size.w, size.h);
        ctx.fillStyle = "rgba(193,107,224,0.08)";
        ctx.fillRect(-shift, 3, size.w, size.h);
        ctx.globalCompositeOperation = "source-over";
      }
      if (g.tear > 0) {
        const tearY = (((performance.now() / 55) | 0) % size.h) | 0;
        ctx.fillStyle = palette.accent;
        ctx.globalAlpha = 0.28 * tr;
        ctx.fillRect(0, tearY, size.w, g.tear);
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = "rgba(0,0,0,0.05)";
    for (let y = 0; y < size.h; y += 4) ctx.fillRect(0, y, size.w, 1);
  }

  function frame(t) {
    if (!ready) return;
    if (RM) {
      drawSprites(t);
      const img = wctx.getImageData(0, 0, size.sw, size.sh);
      applyDither(img);
      wctx.putImageData(img, 0, 0);
      blitWithGlitch();
      return;
    }
    if (!running || !visible || document.hidden) return;

    const dt = Math.min(32, t - (lastT || t));
    lastT = t;

    if (t >= sceneCutAt) newScene();
    if (transition > 0) transition = Math.max(0, transition - dt / transitionDur);

    if (glitch.skip && dt < 20) {
      raf = requestAnimationFrame(frame);
      return;
    }

    beatPulse(t);
    drawSprites(t);
    const img = wctx.getImageData(0, 0, size.sw, size.sh);
    applyDither(img);
    wctx.putImageData(img, 0, 0);
    blitWithGlitch();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastT = 0;
    lastBeat = -1;
    if (sprites.length === 0) newScene();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function visibility() {
    const rect = hero.getBoundingClientRect();
    visible = !document.hidden && rect.bottom > 0 && rect.top < innerHeight;
    if (visible && !RM) start();
    else stop();
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting) && !document.hidden;
      if (visible && !RM) start();
      else stop();
    },
    { threshold: 0.08 },
  );

  async function init() {
    resize();
    await preload();
    if (RM) {
      newScene();
      frame(performance.now());
      return;
    }
    io.observe(hero);
    document.addEventListener("visibilitychange", visibility);
    addEventListener("resize", resize);
    start();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
