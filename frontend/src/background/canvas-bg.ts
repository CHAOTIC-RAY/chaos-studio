import { prefersReducedMotion } from "../motion/reduced-motion";
import { getSmoothMouse } from "../mouse/mouse-state";
import type { Theme } from "../theme";
import { applyBayerDither } from "./dither";

const DITHER_SCALE = 0.4;

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

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/** Touch / coarse pointer: no mouse tracking, so blobs drift on their own. */
function usesAutoBackgroundMotion(): boolean {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

function autoMotionTarget(t: number): { x: number; y: number } {
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

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    bw = Math.max(1, Math.floor(w * DITHER_SCALE));
    bh = Math.max(1, Math.floor(h * DITHER_SCALE));
    buffer.width = bw;
    buffer.height = bh;
  };

  const drawBlobs = (target: CanvasRenderingContext2D, tw: number, th: number, time: number) => {
    const attractTarget = autoAnimate ? autoMotionTarget(time) : getSmoothMouse();
    const mx = attractTarget.x;
    const my = attractTarget.y;
    target.clearRect(0, 0, tw, th);

    const driftT = time * 0.001;

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const attract = autoAnimate ? (i === 0 ? 0.012 : 0.008) : i === 0 ? 0.018 : 0.01;

      if (autoAnimate) {
        b.vx += Math.sin(driftT * 0.9 + b.phase) * 0.00012;
        b.vy += Math.cos(driftT * 0.75 + b.phase) * 0.00012;
        b.x += Math.sin(driftT * 0.35 + b.phase) * 0.00025;
        b.y += Math.cos(driftT * 0.4 + b.phase) * 0.00025;
      }

      b.x += (mx - b.x) * attract + b.vx;
      b.y += (my - b.y) * attract + b.vy;
      b.vx *= autoAnimate ? 0.992 : 0.98;
      b.vy *= autoAnimate ? 0.992 : 0.98;

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

  const draw = (time: number) => {
    drawBlobs(bctx, bw, bh, time);
    applyBayerDither(bctx, bw, bh, currentTheme() === "light" ? 0.18 : 0.28);

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
