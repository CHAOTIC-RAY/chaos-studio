import { prefersReducedMotion } from "./reduced-motion";

function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

function initParallaxTrack(track: HTMLElement, baseVelocity: number): () => void {
  const inner = track.querySelector<HTMLElement>(".work-marquee__inner");
  if (!inner) return () => {};

  let baseX = 0;
  let direction = Math.sign(baseVelocity) || 1;
  let smoothScrollVel = 0;
  let lastScrollY = window.scrollY;
  let raf = 0;
  let lastTime = performance.now();

  const frame = (now: number) => {
    const delta = Math.min(now - lastTime, 64);
    lastTime = now;

    const scrollY = window.scrollY;
    const instantVel = ((scrollY - lastScrollY) / delta) * 1000;
    lastScrollY = scrollY;
    smoothScrollVel += (instantVel - smoothScrollVel) * 0.12;

    const velocityFactor = Math.max(-5, Math.min(5, smoothScrollVel / 200));

    if (velocityFactor < 0) direction = -1;
    else if (velocityFactor > 0) direction = 1;

    let moveBy = direction * baseVelocity * (delta / 1000);
    moveBy += direction * moveBy * Math.abs(velocityFactor);

    baseX += moveBy;
    inner.style.transform = `translate3d(${wrap(-20, -45, baseX)}%, 0, 0)`;

    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

/** Scroll-accelerated client marquee (ported from WorkMarquee / ParallaxText). */
export function initWorkMarquee(): () => void {
  const section = document.querySelector(".work-marquee");
  if (!section) return () => {};

  if (prefersReducedMotion()) {
    section.classList.add("work-marquee--static");
    return () => {};
  }

  const cleanups: (() => void)[] = [];
  section.querySelectorAll<HTMLElement>("[data-marquee-velocity]").forEach((row) => {
    const v = Number(row.dataset.marqueeVelocity) || 1;
    const track = row.querySelector<HTMLElement>(".work-marquee__track");
    if (track) cleanups.push(initParallaxTrack(track, v));
  });

  return () => cleanups.forEach((fn) => fn());
}
