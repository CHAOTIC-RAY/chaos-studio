import { prefersReducedMotion } from "./reduced-motion";

/** Seamless CSS marquee with scroll-speed boost (replaces jumpy % wrap). */
export function initWorkMarquee(): () => void {
  const section = document.querySelector(".work-marquee");
  if (!section) return () => {};

  const rows = section.querySelectorAll<HTMLElement>(".work-marquee__row");
  if (prefersReducedMotion()) {
    section.classList.add("work-marquee--static");
    return () => {};
  }

  const cleanups: (() => void)[] = [];

  rows.forEach((row) => {
    const inner = row.querySelector<HTMLElement>(".work-marquee__inner");
    if (!inner) return;

    const reverse = Number(row.dataset.marqueeVelocity) < 0;
    const baseDuration = 32;
    inner.style.setProperty("--marquee-duration", `${baseDuration}s`);
    if (reverse) inner.classList.add("work-marquee__inner--reverse");

    let smoothVel = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.max(now - lastT, 1);
      lastT = now;
      const y = window.scrollY;
      const instant = ((y - lastY) / dt) * 1000;
      lastY = y;
      smoothVel += (instant - smoothVel) * 0.1;

      const boost = Math.min(Math.abs(smoothVel) / 120, 4);
      const duration = Math.max(8, baseDuration - boost * 6);
      inner.style.setProperty("--marquee-duration", `${duration.toFixed(2)}s`);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    cleanups.push(() => cancelAnimationFrame(raf));
  });

  return () => cleanups.forEach((fn) => fn());
}
