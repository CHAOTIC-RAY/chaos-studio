import { CHAOS_LOGO_SVG } from "./brand/logo";

export function mountLoadingScreen(app: HTMLElement): void {
  app.classList.add("loading-screen");
  app.innerHTML = `
    <div class="loading-reveal" role="status" aria-live="polite" aria-busy="true" aria-label="Loading portfolio">
      <div class="loading-reveal__glow" aria-hidden="true"></div>
      <div class="loading-reveal__logo-wrap">
        <div class="loading-reveal__logo">${CHAOS_LOGO_SVG}</div>
      </div>
      <p class="loading-reveal__label">Chaos Studio</p>
    </div>`;
}

export function exitLoadingScreen(app: HTMLElement): Promise<void> {
  const reveal = app.querySelector(".loading-reveal");
  if (!reveal) {
    app.classList.remove("loading-screen");
    return Promise.resolve();
  }
  app.classList.add("loading-screen--exit");
  return new Promise((resolve) => {
    const done = () => {
      app.classList.remove("loading-screen", "loading-screen--exit");
      resolve();
    };
    reveal.addEventListener("animationend", done, { once: true });
    window.setTimeout(done, 520);
  });
}
