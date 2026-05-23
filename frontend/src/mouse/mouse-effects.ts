import { prefersReducedMotion } from "../motion/reduced-motion";
import { getSmoothMouse, initMouseState, mouse } from "./mouse-state";

function isStudioRoute(): boolean {
  return document.body.classList.contains("route-studio");
}

export function initMouseEffects(): () => void {
  if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) {
    return () => {};
  }

  const studio = isStudioRoute();
  if (!studio) document.body.classList.add("has-pointer-fx");

  const cleanups: (() => void)[] = [initMouseState()];

  if (studio) {
    cleanups.push(initStudioBackgroundParallax());
    cleanups.push(initStudioHeroLogoParallax());
  } else {
    cleanups.push(initCursor());
    cleanups.push(initSpotlight());
    cleanups.push(initParallax());
    cleanups.push(initShowcaseTilt());
    cleanups.push(initHeroParallax());
  }

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

/** Studio: update CSS parallax on pointer move only (no perpetual RAF). */
function initStudioBackgroundParallax(): () => void {
  const layers = document.querySelector<HTMLElement>(".bg-layers--studio");
  if (!layers) return () => {};

  let raf = 0;
  const apply = () => {
    raf = 0;
    const { x, y } = getSmoothMouse();
    layers.style.setProperty("--bg-mx", `${x * 100}%`);
    layers.style.setProperty("--bg-my", `${y * 100}%`);
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };

  window.addEventListener("mousemove", schedule, { passive: true });
  apply();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", schedule);
  };
}

function initStudioHeroLogoParallax(): () => void {
  const mark = document.querySelector<HTMLElement>(".studio-page-logo__mark");
  if (!mark) return () => {};

  let raf = 0;
  const apply = () => {
    raf = 0;
    const { x, y } = getSmoothMouse();
    mark.style.setProperty("--logo-mx", String((x - 0.5) * 10));
    mark.style.setProperty("--logo-my", String((y - 0.5) * 8));
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };

  window.addEventListener("mousemove", schedule, { passive: true });
  apply();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", schedule);
  };
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

/** Subtle tilt on featured-work device previews only — smoothed via rAF lerp. */
function initShowcaseTilt(): () => void {
  const zones = document.querySelectorAll<HTMLElement>("[data-tilt-showcase]");
  const cleanups: (() => void)[] = [];

  zones.forEach((el) => {
    let targetRx = 0;
    let targetRy = 0;
    let currentRx = 0;
    let currentRy = 0;
    let raf = 0;
    let hovering = false;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const apply = () => {
      el.style.setProperty("--rx", `${currentRx.toFixed(3)}deg`);
      el.style.setProperty("--ry", `${currentRy.toFixed(3)}deg`);
    };

    const loop = () => {
      if (!hovering) {
        targetRx = 0;
        targetRy = 0;
      }
      currentRx = lerp(currentRx, targetRx, hovering ? 0.14 : 0.1);
      currentRy = lerp(currentRy, targetRy, hovering ? 0.14 : 0.1);
      apply();

      const settled =
        !hovering &&
        Math.abs(currentRx) < 0.05 &&
        Math.abs(currentRy) < 0.05 &&
        Math.abs(targetRx) < 0.05 &&
        Math.abs(targetRy) < 0.05;

      if (settled) {
        currentRx = 0;
        currentRy = 0;
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      targetRx = -py * 5;
      targetRy = px * 5;
      startLoop();
    };

    const onEnter = () => {
      hovering = true;
      startLoop();
    };

    const onLeave = () => {
      hovering = false;
      startLoop();
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    cleanups.push(() => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
