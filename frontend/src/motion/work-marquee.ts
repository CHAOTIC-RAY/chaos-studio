import { prefersReducedMotion } from "./reduced-motion";

function initMarqueeRow(inner: HTMLElement, velocity: number): () => void {
  inner.style.animation = "none";

  const group = inner.querySelector<HTMLElement>(".work-marquee__group");
  if (!group) return () => {};

  const direction = Math.sign(velocity) || 1;
  const baseSpeed = Math.abs(velocity) * 28;

  let offset = 0;
  let loopWidth = group.offsetWidth;
  let smoothScrollVel = 0;
  let lastScrollY = window.scrollY;
  let lastTime = performance.now();
  let raf = 0;

  const measure = () => {
    loopWidth = group.offsetWidth || inner.scrollWidth / 2;
    if (loopWidth < 1) loopWidth = 1;
  };

  measure();
  const onResize = () => measure();
  window.addEventListener("resize", onResize);

  const tick = (now: number) => {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    const scrollY = window.scrollY;
    const instantScrollVel = dt > 0 ? (scrollY - lastScrollY) / dt : 0;
    lastScrollY = scrollY;
    smoothScrollVel += (instantScrollVel - smoothScrollVel) * 0.08;

    const scrollBoost = Math.max(-80, Math.min(80, smoothScrollVel * 0.12));
    const pxPerSec = direction * baseSpeed + scrollBoost;

    offset += pxPerSec * dt;

    if (offset <= -loopWidth) offset += loopWidth;
    if (offset > 0) offset -= loopWidth;

    inner.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    inner.style.transform = "";
    inner.style.animation = "";
  };
}

/** Pixel-based seamless marquee — avoids glitchy animation-duration changes on scroll. */
export function initWorkMarquee(): () => void {
  const section = document.querySelector(".work-marquee");
  if (!section) return () => {};

  if (prefersReducedMotion()) {
    section.classList.add("work-marquee--static");
    return () => {};
  }

  section.classList.add("work-marquee--enhanced");

  const cleanups: (() => void)[] = [];
  section.querySelectorAll<HTMLElement>(".work-marquee__row").forEach((row) => {
    const inner = row.querySelector<HTMLElement>(".work-marquee__inner");
    if (!inner) return;
    const velocity = Number(row.dataset.marqueeVelocity) || 1;
    cleanups.push(initMarqueeRow(inner, velocity));
  });

  return () => {
    section.classList.remove("work-marquee--enhanced");
    cleanups.forEach((fn) => fn());
  };
}
