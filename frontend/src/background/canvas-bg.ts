import { CHAOS_LOGO_VIEWBOX, getChaosLogoPath } from "../brand/logo";
import { getStudioScrollState } from "../motion/studio-scroll";
import { prefersReducedMotion } from "../motion/reduced-motion";
import { getSmoothMouse } from "../mouse/mouse-state";
import type { Theme } from "../theme";
import { applyBayerDither, type DitherProfile } from "./dither";

const DITHER_SCALE_DEFAULT = 0.38;
const DITHER_SCALE_STUDIO = 0.2;
const MAX_DPR = 1.5;
const STUDIO_FRAME_MS = 36;
const PORTFOLIO_FRAME_MS = 32;
/** Re-draw portfolio canvas periodically so mouse dither stays visible while idle. */
const PORTFOLIO_AMBIENT_MS = 64;

const BLOB_PALETTES: Record<Theme, [string, string, string]> = {
  dark: [
    "rgba(213, 119, 237, 0.32)",
    "rgba(168, 72, 198, 0.2)",
    "rgba(120, 60, 180, 0.18)",
  ],
};

function currentTheme(): Theme {
  return "dark";
}

function isStudioRoute(): boolean {
  return document.body.classList.contains("route-studio");
}

/** Touch / coarse pointer: no mouse tracking, so blobs drift on their own. */
function usesAutoBackgroundMotion(): boolean {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

function autoMotionTarget(t: number, studio: boolean): { x: number; y: number } {
  if (studio) {
    const s = t * 0.0004;
    return {
      x: 0.5 + Math.sin(s) * 0.08,
      y: 0.38 + Math.cos(s * 0.9) * 0.06,
    };
  }
  const s = t * 0.00055;
  return {
    x: 0.5 + Math.sin(s) * 0.26 + Math.sin(s * 1.65 + 1.2) * 0.1,
    y: 0.5 + Math.cos(s * 0.85) * 0.22 + Math.cos(s * 1.35 + 0.6) * 0.09,
  };
}

function studioPointerTarget(time: number): { x: number; y: number } {
  if (usesAutoBackgroundMotion()) return autoMotionTarget(time, true);
  const m = getSmoothMouse();
  return {
    x: 0.5 + (m.x - 0.5) * 0.62,
    y: 0.38 + (m.y - 0.5) * 0.55,
  };
}

function drawStudioLogoAt(
  target: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scaleMul: number,
  time: number,
  _theme: Theme,
  alpha: number,
  solidFill: boolean,
): void {
  const path = getChaosLogoPath();
  const pulse = 1 + Math.sin(time * 0.001) * 0.02;
  const wobble = Math.sin(time * 0.0005) * 0.006;
  const fit = (Math.min(target.canvas.width, target.canvas.height) * 0.62) / CHAOS_LOGO_VIEWBOX.h;
  const s = fit * pulse * scaleMul;

  target.save();
  target.globalAlpha = alpha;
  target.translate(cx, cy);
  target.rotate(wobble);
  target.scale(s, s);
  target.translate(-CHAOS_LOGO_VIEWBOX.w / 2, -CHAOS_LOGO_VIEWBOX.h / 2);
  target.clip(path);

  const lx = CHAOS_LOGO_VIEWBOX.w * 0.5;
  const ly = CHAOS_LOGO_VIEWBOX.h * 0.42;
  const r = CHAOS_LOGO_VIEWBOX.w * 0.78;

  if (solidFill) {
    target.fillStyle = "rgba(213, 119, 237, 0.92)";
    target.fillRect(-CHAOS_LOGO_VIEWBOX.w, -CHAOS_LOGO_VIEWBOX.h, CHAOS_LOGO_VIEWBOX.w * 3, CHAOS_LOGO_VIEWBOX.h * 3);
  } else {
    const core = target.createRadialGradient(lx, ly, 0, lx, ly, r * 0.55);
    core.addColorStop(0, "rgba(232, 160, 245, 0.95)");
    core.addColorStop(0.35, "rgba(213, 119, 237, 0.72)");
    core.addColorStop(0.7, "rgba(120, 60, 180, 0.28)");
    core.addColorStop(1, "rgba(0, 0, 0, 0)");
    target.fillStyle = core;
    target.fillRect(0, 0, CHAOS_LOGO_VIEWBOX.w, CHAOS_LOGO_VIEWBOX.h);

    const rim = target.createRadialGradient(lx, ly * 0.92, r * 0.2, lx, ly, r);
    rim.addColorStop(0, "rgba(78, 19, 112, 0)");
    rim.addColorStop(0.55, "rgba(168, 72, 198, 0.35)");
    rim.addColorStop(1, "rgba(213, 119, 237, 0.12)");
    target.fillStyle = rim;
    target.fillRect(0, 0, CHAOS_LOGO_VIEWBOX.w, CHAOS_LOGO_VIEWBOX.h);
  }

  target.restore();
}

function drawStudioLogoGlow(
  target: CanvasRenderingContext2D,
  tw: number,
  th: number,
  time: number,
  mx: number,
  my: number,
  theme: Theme,
): void {
  const { reveal, scale, fill, finale } = getStudioScrollState();
  if (reveal < 0.004 && fill < 0.004) return;

  const parallaxX = (mx - 0.5) * 0.14;
  const parallaxY = (my - 0.5) * 0.12;
  const cx = tw * (0.5 + parallaxX);
  const cy = th * (0.36 + parallaxY + finale * 0.22);

  const glowAlpha = reveal * (1 - fill * 0.55);
  if (glowAlpha > 0.01) {
    drawStudioLogoAt(target, cx, cy, scale, time, theme, glowAlpha, false);
  }

  if (fill > 0.02) {
    const floodScale = scale * (1 + fill * 2.8);
    drawStudioLogoAt(target, cx, cy, floodScale, time, theme, fill * 0.95, true);
  }

  if (fill > 0.08) {
    target.save();
    target.globalAlpha = fill * 0.35;
    const wash = target.createRadialGradient(cx, cy, 0, cx, cy, Math.max(tw, th) * 0.85);
    wash.addColorStop(0, "rgba(213, 119, 237, 0.45)");
    wash.addColorStop(0.45, "rgba(120, 60, 180, 0.28)");
    wash.addColorStop(1, "rgba(10, 6, 16, 0)");
    target.fillStyle = wash;
    target.fillRect(0, 0, tw, th);
    target.restore();
  }

  if (reveal > 0.05 && fill < 0.65) {
    const ax = mx * tw;
    const ay = my * th;
    const amb = target.createRadialGradient(ax, ay, 0, ax, ay, Math.min(tw, th) * 0.5);
    amb.addColorStop(0, "rgba(78, 19, 112, 0.18)");
    amb.addColorStop(1, "rgba(0, 0, 0, 0)");
    target.globalAlpha = reveal * 0.85;
    target.fillStyle = amb;
    target.fillRect(0, 0, tw, th);
  }
}

export function initCanvasBackground(): () => void {
  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement | null;
  if (!canvas || prefersReducedMotion()) return () => {};

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};

  const buffer = document.createElement("canvas");
  const bctx = buffer.getContext("2d", { alpha: true });
  if (!bctx) return () => {};

  const autoAnimate = usesAutoBackgroundMotion();

  const blobs = [
    { x: 0.15, y: 0.25, r: 0.38, vx: 0, vy: 0, phase: 0, color: "" },
    { x: 0.8, y: 0.15, r: 0.3, vx: 0, vy: 0, phase: 2.1, color: "" },
    { x: 0.55, y: 0.75, r: 0.32, vx: 0, vy: 0, phase: 4.2, color: "" },
  ];

  const syncPalette = () => {
    if (isStudioRoute()) return;
    const palette = BLOB_PALETTES[currentTheme()];
    blobs.forEach((b, i) => {
      b.color = palette[i];
    });
  };
  syncPalette();

  let w = 0;
  let h = 0;
  let bw = 0;
  let bh = 0;
  let raf = 0;
  let lastDraw = 0;
  let lastDrawKey = "";
  let studioCleared = false;
  let wasStudio = isStudioRoute();

  const resize = () => {
    const studio = isStudioRoute();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = studio ? DITHER_SCALE_STUDIO : DITHER_SCALE_DEFAULT;
    bw = Math.max(1, Math.floor(w * scale));
    bh = Math.max(1, Math.floor(h * scale));
    buffer.width = bw;
    buffer.height = bh;
  };

  const drawBlobs = (target: CanvasRenderingContext2D, tw: number, th: number, time: number) => {
    const attractTarget = autoAnimate ? autoMotionTarget(time, false) : getSmoothMouse();
    const mx = attractTarget.x;
    const my = attractTarget.y;
    target.clearRect(0, 0, tw, th);

    const driftT = time * 0.001;

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const attract = autoAnimate ? (i === 0 ? 0.012 : 0.008) : i === 0 ? 0.018 : 0.01;

      if (autoAnimate) {
        const drift = 0.00012;
        b.vx += Math.sin(driftT * 0.9 + b.phase) * drift;
        b.vy += Math.cos(driftT * 0.75 + b.phase) * drift;
        b.x += Math.sin(driftT * 0.35 + b.phase) * (drift * 2);
        b.y += Math.cos(driftT * 0.4 + b.phase) * (drift * 2);
      }

      b.x += (mx - b.x) * attract + b.vx;
      b.y += (my - b.y) * attract + b.vy;
      b.vy *= autoAnimate ? 0.992 : 0.98;
      b.vx *= autoAnimate ? 0.992 : 0.98;

      b.x = Math.max(0.05, Math.min(0.95, b.x));
      b.y = Math.max(0.05, Math.min(0.95, b.y));

      const cx = b.x * tw;
      const cy = b.y * th;
      const radius = b.r * Math.min(tw, th);
      const g = target.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, b.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      target.fillStyle = g;
      target.beginPath();
      target.arc(cx, cy, radius, 0, Math.PI * 2);
      target.fill();
    }
  };

  const shouldRedraw = (time: number, key: string, frameMs: number) => {
    if (document.hidden) return false;
    const due = time - lastDraw >= frameMs;
    if (!due && key === lastDrawKey) return false;
    lastDraw = time;
    lastDrawKey = key;
    return true;
  };

  const draw = (time: number) => {
    const studio = isStudioRoute();
    if (studio !== wasStudio) {
      wasStudio = studio;
      lastDrawKey = "";
      syncPalette();
      resize();
    }
    const profile: DitherProfile = studio ? "studio" : "default";
    const theme = currentTheme();

    if (studio) {
      const scroll = getStudioScrollState();
      const visible = scroll.reveal > 0.004 || scroll.fill > 0.004;

      if (!visible) {
        if (!studioCleared) {
          ctx.clearRect(0, 0, w, h);
          studioCleared = true;
          lastDrawKey = "";
        }
        raf = requestAnimationFrame(draw);
        return;
      }
      studioCleared = false;

      const scrollKey = `${scroll.reveal.toFixed(3)}|${scroll.scale.toFixed(2)}|${scroll.fill.toFixed(3)}|${scroll.finale.toFixed(3)}`;
      const pointer = studioPointerTarget(time);
      const drawKey = `${scrollKey}|${pointer.x.toFixed(2)}|${pointer.y.toFixed(2)}|${theme}`;

      if (shouldRedraw(time, drawKey, STUDIO_FRAME_MS)) {
        const { x: mx, y: my } = pointer;
        bctx.clearRect(0, 0, bw, bh);
        drawStudioLogoGlow(bctx, bw, bh, time, mx, my, theme);
        const ditherReveal = scroll.reveal * (1 - scroll.fill * 0.7) + scroll.fill * 0.35;
        if (ditherReveal > 0.02) {
          applyBayerDither(bctx, bw, bh, {
            profile,
            lite: true,
            strength: 0.52 * ditherReveal,
            noise: 0.45 * ditherReveal,
            vignetteNoise: false,
            cx: mx,
            cy: my + scroll.finale * 0.15,
          });
        }
        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(buffer, 0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
      }
    } else {
      const attract = autoAnimate ? autoMotionTarget(time, false) : getSmoothMouse();
      const blobKey = blobs.map((b) => `${b.x.toFixed(2)},${b.y.toFixed(2)}`).join("|");
      const ambient = Math.floor(time / PORTFOLIO_AMBIENT_MS);
      const drawKey = `${attract.x.toFixed(2)}|${attract.y.toFixed(2)}|${blobKey}|${theme}|${ambient}`;

      if (shouldRedraw(time, drawKey, PORTFOLIO_FRAME_MS)) {
        drawBlobs(bctx, bw, bh, time);
        applyBayerDither(bctx, bw, bh, {
          profile: "default",
          lite: false,
          strength: 0.44,
          noise: 0.3,
          cx: attract.x,
          cy: attract.y,
        });
        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(buffer, 0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
      }
    }

    raf = requestAnimationFrame(draw);
  };

  const onTheme = () => syncPalette();
  window.addEventListener("themechange", onTheme);

  resize();
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("themechange", onTheme);
  };
}
