import { prefersReducedMotion } from "../motion/reduced-motion";
import { getSmoothMouse } from "../mouse/mouse-state";
import type { Theme } from "../theme";
import { applyBayerDither, type DitherProfile } from "./dither";

const DITHER_SCALE_DEFAULT = 0.4;
const DITHER_SCALE_STUDIO = 0.28;

const BLOB_PALETTES: Record<Theme, [string, string, string]> = {
  light: [
    "rgba(213, 119, 237, 0.22)",
    "rgba(168, 72, 198, 0.14)",
    "rgba(139, 61, 173, 0.12)",
  ],
  dark: [
    "rgba(213, 119, 237, 0.32)",
    "rgba(168, 72, 198, 0.2)",
    "rgba(120, 60, 180, 0.18)",
  ],
};

const BLOB_PALETTES_STUDIO: Record<Theme, [string, string, string]> = {
  light: [
    "rgba(213, 119, 237, 0.28)",
    "rgba(139, 61, 173, 0.2)",
    "rgba(78, 19, 112, 0.16)",
  ],
  dark: [
    "rgba(213, 119, 237, 0.38)",
    "rgba(168, 72, 198, 0.26)",
    "rgba(120, 60, 180, 0.22)",
  ],
};

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
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
      x: 0.5 + Math.sin(s) * 0.06,
      y: 0.38 + Math.cos(s * 0.9) * 0.05,
    };
  }
  const s = t * 0.00055;
  return {
    x: 0.5 + Math.sin(s) * 0.26 + Math.sin(s * 1.65 + 1.2) * 0.1,
    y: 0.5 + Math.cos(s * 0.85) * 0.22 + Math.cos(s * 1.35 + 0.6) * 0.09,
  };
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
    const studio = isStudioRoute();
    const palette = (studio ? BLOB_PALETTES_STUDIO : BLOB_PALETTES)[currentTheme()];
    blobs.forEach((b, i) => {
      b.color = palette[i];
    });
    if (studio) {
      blobs[0].x = 0.5;
      blobs[0].y = 0.38;
      blobs[0].r = 0.48;
      blobs[1].x = 0.22;
      blobs[1].y = 0.55;
      blobs[1].r = 0.28;
      blobs[2].x = 0.78;
      blobs[2].y = 0.55;
      blobs[2].r = 0.28;
    }
  };
  syncPalette();

  let w = 0;
  let h = 0;
  let bw = 0;
  let bh = 0;
  let raf = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = isStudioRoute() ? DITHER_SCALE_STUDIO : DITHER_SCALE_DEFAULT;
    bw = Math.max(1, Math.floor(w * scale));
    bh = Math.max(1, Math.floor(h * scale));
    buffer.width = bw;
    buffer.height = bh;
  };

  const drawBlobs = (target: CanvasRenderingContext2D, tw: number, th: number, time: number) => {
    const studio = isStudioRoute();
    const attractTarget = autoAnimate
      ? autoMotionTarget(time, studio)
      : studio
        ? { x: 0.5, y: 0.38 }
        : getSmoothMouse();
    const mx = attractTarget.x;
    const my = attractTarget.y;
    target.clearRect(0, 0, tw, th);

    const driftT = time * 0.001;

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const attract = studio
        ? i === 0
          ? 0.028
          : 0.014
        : autoAnimate
          ? i === 0
            ? 0.012
            : 0.008
          : i === 0
            ? 0.018
            : 0.01;

      if (autoAnimate) {
        const drift = studio ? 0.00008 : 0.00012;
        b.vx += Math.sin(driftT * 0.9 + b.phase) * drift;
        b.vy += Math.cos(driftT * 0.75 + b.phase) * drift;
        b.x += Math.sin(driftT * 0.35 + b.phase) * (drift * 2);
        b.y += Math.cos(driftT * 0.4 + b.phase) * (drift * 2);
      }

      b.x += (mx - b.x) * attract + b.vx;
      b.y += (my - b.y) * attract + b.vy;
      b.vy *= autoAnimate ? 0.992 : 0.98;
      b.vx *= autoAnimate ? 0.992 : 0.98;

      const pad = studio ? 0.02 : 0.05;
      b.x = Math.max(pad, Math.min(1 - pad, b.x));
      b.y = Math.max(pad, Math.min(1 - pad, b.y));

      const cx = b.x * tw;
      const cy = b.y * th;
      const radius = b.r * Math.min(tw, th);
      const g = target.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, b.color);
      g.addColorStop(studio && i === 0 ? 0.55 : 1, studio && i === 0 ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      target.fillStyle = g;
      target.beginPath();
      target.arc(cx, cy, radius, 0, Math.PI * 2);
      target.fill();
    }
  };

  const draw = (time: number) => {
    const studio = isStudioRoute();
    const profile: DitherProfile = studio ? "studio" : "default";
    const theme = currentTheme();

    drawBlobs(bctx, bw, bh, time);
    applyBayerDither(bctx, bw, bh, {
      profile,
      strength: studio ? (theme === "light" ? 0.48 : 0.58) : theme === "light" ? 0.2 : 0.3,
      noise: studio ? 0.62 : 0.1,
      vignetteNoise: studio,
      cx: 0.5,
      cy: 0.38,
    });

    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;

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
