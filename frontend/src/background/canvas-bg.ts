import { prefersReducedMotion } from "../motion/reduced-motion";

interface Blob {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
}

export function initCanvasBackground(): () => void {
  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement | null;
  if (!canvas || prefersReducedMotion()) return () => {};

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const blobs: Blob[] = [
    { x: 0.2, y: 0.3, r: 0.35, vx: 0.00008, vy: 0.00006, color: "rgba(200, 245, 66, 0.22)" },
    { x: 0.75, y: 0.2, r: 0.28, vx: -0.00006, vy: 0.00009, color: "rgba(255, 107, 74, 0.12)" },
    { x: 0.5, y: 0.7, r: 0.32, vx: 0.00005, vy: -0.00007, color: "rgba(120, 90, 200, 0.14)" },
  ];

  let width = 0;
  let height = 0;
  let raf = 0;
  let running = true;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    for (const b of blobs) {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < 0.1 || b.x > 0.9) b.vx *= -1;
      if (b.y < 0.1 || b.y > 0.9) b.vy *= -1;

      const cx = b.x * width;
      const cy = b.y * height;
      const radius = b.r * Math.min(width, height);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (running) {
      raf = requestAnimationFrame(draw);
    }
  };

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);

  const start = () => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        raf = requestAnimationFrame(draw);
      });
    } else {
      setTimeout(() => {
        raf = requestAnimationFrame(draw);
      }, 100);
    }
  };
  start();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
