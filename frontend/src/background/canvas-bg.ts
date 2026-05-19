import { prefersReducedMotion } from "../motion/reduced-motion";
import { getSmoothMouse } from "../mouse/mouse-state";

export function initCanvasBackground(): () => void {
  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement | null;
  if (!canvas || prefersReducedMotion()) return () => {};

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const blobs = [
    { x: 0.15, y: 0.25, r: 0.38, vx: 0, vy: 0, color: "rgba(213, 119, 237, 0.32)" },
    { x: 0.8, y: 0.15, r: 0.3, vx: 0, vy: 0, color: "rgba(168, 72, 198, 0.2)" },
    { x: 0.55, y: 0.75, r: 0.32, vx: 0, vy: 0, color: "rgba(120, 60, 180, 0.18)" },
  ];

  let w = 0;
  let h = 0;
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
  };

  const draw = () => {
    const { x: mx, y: my } = getSmoothMouse();
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const attract = i === 0 ? 0.018 : 0.01;
      b.x += (mx - b.x) * attract + b.vx;
      b.y += (my - b.y) * attract + b.vy;
      b.vx *= 0.98;
      b.vy *= 0.98;

      const cx = b.x * w;
      const cy = b.y * h;
      const radius = b.r * Math.min(w, h);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, b.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}
