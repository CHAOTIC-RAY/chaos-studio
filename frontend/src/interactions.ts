import { prefersReducedMotion } from "./motion/reduced-motion";

export function initInteractions(): () => void {
  const cleanups: (() => void)[] = [];

  if (!prefersReducedMotion()) {
    cleanups.push(initMagneticButtons());
    cleanups.push(initCustomCursor());
  }

  cleanups.push(initProjectHovers());
  return () => cleanups.forEach((fn) => fn());
}

function initMagneticButtons(): () => void {
  const buttons = document.querySelectorAll<HTMLElement>("[data-magnetic]");
  const handlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];

  buttons.forEach((el) => {
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    handlers.push({ el, move, leave });
  });

  return () => {
    handlers.forEach(({ el, move, leave }) => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    });
  };
}

function initCustomCursor(): () => void {
  if (!window.matchMedia("(pointer: fine)").matches) return () => {};

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);

  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let raf = 0;

  const onMove = (e: MouseEvent) => {
    x = e.clientX;
    y = e.clientY;
  };

  const loop = () => {
    tx += (x - tx) * 0.18;
    ty += (y - ty) * 0.18;
    dot.style.transform = `translate(${tx - 6}px, ${ty - 6}px)`;
    raf = requestAnimationFrame(loop);
  };

  const onEnterLink = () => dot.classList.add("is-hover");
  const onLeaveLink = () => dot.classList.remove("is-hover");

  document.addEventListener("mousemove", onMove);
  raf = requestAnimationFrame(loop);

  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("mouseenter", onEnterLink);
    el.addEventListener("mouseleave", onLeaveLink);
  });

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("mousemove", onMove);
    dot.remove();
  };
}

function initProjectHovers(): () => void {
  const cards = document.querySelectorAll<HTMLElement>(".project-card");
  const cleanups: (() => void)[] = [];

  cards.forEach((card) => {
    const img = card.querySelector<HTMLImageElement>(".project-cover");
    const hoverSrc = card.dataset.coverHover;
    if (!img || !hoverSrc) return;

    const defaultSrc = img.src;
    const enter = () => {
      img.src = hoverSrc;
    };
    const leave = () => {
      img.src = defaultSrc;
    };
    card.addEventListener("mouseenter", enter);
    card.addEventListener("mouseleave", leave);
    cleanups.push(() => {
      card.removeEventListener("mouseenter", enter);
      card.removeEventListener("mouseleave", leave);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
