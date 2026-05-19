import { prefersReducedMotion } from "./motion/reduced-motion";

export function initInteractions(): () => void {
  const cleanups: (() => void)[] = [];
  if (!prefersReducedMotion()) cleanups.push(initMagnetic());
  cleanups.push(initPostsMarquee());
  return () => cleanups.forEach((fn) => fn());
}

function initMagnetic(): () => void {
  const els = document.querySelectorAll<HTMLElement>("[data-magnetic]");
  const pairs: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];
  els.forEach((el) => {
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.12}px, ${(e.clientY - r.top - r.height / 2) * 0.12}px)`;
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    pairs.push({ el, move, leave });
  });
  return () => pairs.forEach(({ el, move, leave }) => {
    el.removeEventListener("mousemove", move);
    el.removeEventListener("mouseleave", leave);
  });
}

function initPostsMarquee(): () => void {
  const track = document.querySelector(".posts-track") as HTMLElement | null;
  if (!track || prefersReducedMotion()) return () => {};
  let x = 0;
  let raf = 0;
  const speed = 0.35;
  const loop = () => {
    x -= speed;
    const half = track.scrollWidth / 2;
    if (half > 0 && Math.abs(x) >= half) x = 0;
    track.style.transform = `translateX(${x}px)`;
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}
