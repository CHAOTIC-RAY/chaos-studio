import { prefersReducedMotion } from "../motion/reduced-motion";
import { getSmoothMouse, initMouseState, mouse } from "./mouse-state";

export function initMouseEffects(): () => void {
  if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) {
    return () => {};
  }

  document.body.classList.add("has-pointer-fx");

  const cleanups: (() => void)[] = [
    initMouseState(),
    initCursor(),
    initSpotlight(),
    initParallax(),
    initTiltCards(),
    initHeroParallax(),
  ];

  return () => {
    document.body.classList.remove("has-pointer-fx");
    cleanups.forEach((fn) => fn());
  };
}

function initCursor(): () => void {
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  ring.setAttribute("aria-hidden", "true");
  document.body.append(dot, ring);

  let tx = 0;
  let ty = 0;
  let rx = 0;
  let ry = 0;
  let raf = 0;

  const loop = () => {
    const targetX = mouse.px;
    const targetY = mouse.py;
    tx += (targetX - tx) * 0.22;
    ty += (targetY - ty) * 0.22;
    rx += (targetX - rx) * 0.12;
    ry += (targetY - ry) * 0.12;
    dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    ring.classList.toggle("is-idle", !mouse.active);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const onEnter = () => ring.classList.add("is-hover");
  const onLeave = () => ring.classList.remove("is-hover");
  document.querySelectorAll("a, button, [data-magnetic]").forEach((el) => {
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
  });

  return () => {
    cancelAnimationFrame(raf);
    dot.remove();
    ring.remove();
  };
}

function initSpotlight(): () => void {
  const el = document.createElement("div");
  el.className = "mouse-spotlight";
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);

  let raf = 0;
  const loop = () => {
    const { x, y } = getSmoothMouse();
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    el.remove();
  };
}

function initParallax(): () => void {
  const layers = document.querySelectorAll<HTMLElement>("[data-parallax]");
  let raf = 0;
  const loop = () => {
    const { x, y } = getSmoothMouse();
    const dx = (x - 0.5) * 2;
    const dy = (y - 0.5) * 2;
    layers.forEach((el) => {
      const depth = Number(el.dataset.parallax) || 12;
      el.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
    });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

function initHeroParallax(): () => void {
  const hero = document.querySelector(".hero") as HTMLElement | null;
  if (!hero) return () => {};
  let raf = 0;
  const loop = () => {
    const { x, y } = getSmoothMouse();
    hero.style.setProperty("--hero-mx", String((x - 0.5) * 30));
    hero.style.setProperty("--hero-my", String((y - 0.5) * 20));
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

function initTiltCards(): () => void {
  const cards = document.querySelectorAll<HTMLElement>("[data-tilt]");
  const handlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];

  cards.forEach((el) => {
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-py * 10}deg) rotateY(${px * 10}deg) translateZ(8px)`;
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    handlers.push({ el, move, leave });
  });

  return () =>
    handlers.forEach(({ el, move, leave }) => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    });
}
