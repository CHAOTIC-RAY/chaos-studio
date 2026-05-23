import { prefersReducedMotion } from "./reduced-motion";

export type StudioScrollState = {
  /** Background logo visibility 0–1 */
  reveal: number;
  /** Logo scale multiplier (grows while scrolling) */
  scale: number;
  /** Purple logo-color flood 0–1 */
  fill: number;
  /** Finale section progress 0–1 */
  finale: number;
};

const INITIAL: StudioScrollState = {
  reveal: 0,
  scale: 0.48,
  fill: 0,
  finale: 0,
};

let state: StudioScrollState = { ...INITIAL };
let target: StudioScrollState = { ...INITIAL };
let current: StudioScrollState = { ...INITIAL };

/** Eased value exposed to canvas + CSS (lerped each frame). */
export function getStudioScrollState(): StudioScrollState {
  return state;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Smoother than smoothstep — gentler start/end for scroll-driven motion. */
function smootherstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function lerpState(a: StudioScrollState, b: StudioScrollState, t: number): StudioScrollState {
  return {
    reveal: a.reveal + (b.reveal - a.reveal) * t,
    scale: a.scale + (b.scale - a.scale) * t,
    fill: a.fill + (b.fill - a.fill) * t,
    finale: a.finale + (b.finale - a.finale) * t,
  };
}

function stateDelta(a: StudioScrollState, b: StudioScrollState): number {
  return (
    Math.abs(a.reveal - b.reveal) +
    Math.abs(a.scale - b.scale) * 0.08 +
    Math.abs(a.fill - b.fill) +
    Math.abs(a.finale - b.finale)
  );
}

function applyCssVars(s: StudioScrollState): void {
  const root = document.documentElement;
  root.style.setProperty("--studio-logo-reveal", s.reveal.toFixed(4));
  root.style.setProperty("--studio-logo-scale", s.scale.toFixed(4));
  root.style.setProperty("--studio-logo-fill", s.fill.toFixed(4));
  root.style.setProperty("--studio-finale", s.finale.toFixed(4));
  document.body.classList.toggle("studio-finale-active", s.finale > 0.45);
}

function clearCssVars(): void {
  const root = document.documentElement;
  root.style.removeProperty("--studio-logo-reveal");
  root.style.removeProperty("--studio-logo-scale");
  root.style.removeProperty("--studio-logo-fill");
  root.style.removeProperty("--studio-finale");
  document.body.classList.remove("studio-finale-active");
}

export function initStudioScrollEffect(): () => void {
  if (!document.body.classList.contains("route-studio")) return () => {};

  const page = document.querySelector<HTMLElement>(".page-studio");
  const finale = document.getElementById("studio-contact");
  if (!page) return () => {};

  if (prefersReducedMotion()) {
    state = { reveal: 1, scale: 1.1, fill: 0, finale: 0 };
    applyCssVars(state);
    return () => {
      state = { ...INITIAL };
      target = { ...INITIAL };
      current = { ...INITIAL };
      clearCssVars();
    };
  }

  let measureRaf = 0;
  let smoothRaf = 0;
  const SMOOTH_RATE = 0.11;
  const SETTLE_EPS = 0.0015;

  const measureTarget = () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const pageTop = page.offsetTop;
    const pageHeight = page.offsetHeight;
    const scrollInPage = scrollY - pageTop + vh * 0.12;

    const revealStart = vh * 0.08;
    const revealSpan = vh * 1.35;
    const reveal = smootherstep((scrollInPage - revealStart) / revealSpan);

    const growStart = vh * 0.35;
    const growSpan = Math.max(vh * 2.6, pageHeight - vh * 2.2);
    const grow = smootherstep((scrollInPage - growStart) / growSpan);
    const scale = 0.48 + grow * 3.4;

    let fill = 0;
    let finaleProgress = 0;
    if (finale) {
      const rect = finale.getBoundingClientRect();
      const finaleTop = scrollY + rect.top;
      const enter = finaleTop - vh * 0.65;
      const peak = finaleTop - vh * 0.05;
      finaleProgress = smootherstep((scrollY - enter) / Math.max(1, peak - enter));
      const floodStart = finaleTop - vh * 0.5;
      const floodPeak = finaleTop + vh * 0.2;
      fill = smootherstep((scrollY - floodStart) / Math.max(1, floodPeak - floodStart));
    }

    target = { reveal, scale, fill, finale: finaleProgress };
  };

  const ensureSmoothLoop = () => {
    if (!smoothRaf) smoothRaf = requestAnimationFrame(smoothTick);
  };

  const smoothTick = () => {
    smoothRaf = 0;
    current = lerpState(current, target, SMOOTH_RATE);
    state = current;
    applyCssVars(current);

    if (stateDelta(current, target) > SETTLE_EPS) {
      smoothRaf = requestAnimationFrame(smoothTick);
    }
  };

  const onScroll = () => {
    cancelAnimationFrame(measureRaf);
    measureRaf = requestAnimationFrame(() => {
      measureTarget();
      ensureSmoothLoop();
    });
  };

  measureTarget();
  applyCssVars(target);
  current = { ...target };
  state = current;
  ensureSmoothLoop();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  return () => {
    cancelAnimationFrame(measureRaf);
    cancelAnimationFrame(smoothRaf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    state = { ...INITIAL };
    target = { ...INITIAL };
    current = { ...INITIAL };
    clearCssVars();
  };
}
