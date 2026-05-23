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

let state: StudioScrollState = {
  reveal: 0,
  scale: 0.48,
  fill: 0,
  finale: 0,
};

export function getStudioScrollState(): StudioScrollState {
  return state;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
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
      state = { reveal: 0, scale: 0.48, fill: 0, finale: 0 };
      clearCssVars();
    };
  }

  let raf = 0;

  const measure = () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const pageTop = page.offsetTop;
    const pageHeight = page.offsetHeight;
    const scrollInPage = scrollY - pageTop + vh * 0.12;

    const revealStart = vh * 0.05;
    const revealSpan = vh * 1.15;
    const reveal = smoothstep((scrollInPage - revealStart) / revealSpan);

    const growStart = vh * 0.25;
    const growSpan = Math.max(vh * 2.2, pageHeight - vh * 2.4);
    const grow = smoothstep((scrollInPage - growStart) / growSpan);
    const scale = 0.46 + grow * 4.2;

    let fill = 0;
    let finaleProgress = 0;
    if (finale) {
      const rect = finale.getBoundingClientRect();
      const finaleTop = scrollY + rect.top;
      const enter = finaleTop - vh * 0.55;
      const peak = finaleTop - vh * 0.08;
      finaleProgress = smoothstep((scrollY - enter) / Math.max(1, peak - enter));
      const floodStart = finaleTop - vh * 0.35;
      const floodPeak = finaleTop + vh * 0.12;
      fill = smoothstep((scrollY - floodStart) / Math.max(1, floodPeak - floodStart));
    }

    state = {
      reveal,
      scale,
      fill,
      finale: finaleProgress,
    };
    applyCssVars(state);
  };

  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(measure);
  };

  measure();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    state = { reveal: 0, scale: 0.48, fill: 0, finale: 0 };
    clearCssVars();
  };
}
