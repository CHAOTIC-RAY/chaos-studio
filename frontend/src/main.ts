import "./styles/index.css";
import { fetchPortfolio } from "./api";
import { exitLoadingScreen, mountLoadingScreen } from "./loading-screen";
import { initCanvasBackground } from "./background/canvas-bg";
import { initInteractions, initStudioInteractions } from "./interactions";
import { initMouseEffects } from "./mouse/mouse-effects";
import { onVisibilityChange } from "./motion/perf";
import { initHeaderScroll, initScrollAnimations } from "./motion/scroll";
import { initWorkMarquee } from "./motion/work-marquee";
import { downloadPortfolioPdf } from "./pdf-export";
import { initPostLightbox } from "./post-lightbox";
import { initGalleryPanorama } from "./gallery-panorama";
import { renderPage, renderStudioPage, renderGalleryPage } from "./render";
import { getRoute, navigateTo, type AppRoute } from "./router";
import type { Portfolio } from "./types/portfolio";
import { initTheme } from "./theme";

let portfolio: Portfolio | null = null;
const cleanups: (() => void)[] = [];
let firstMount = true;

function runCleanup(): void {
  while (cleanups.length) {
    const fn = cleanups.pop();
    fn?.();
  }
}

async function mount(route: AppRoute): Promise<void> {
  const app = document.getElementById("app");
  if (!app || !portfolio) return;

  if (!firstMount) {
    app.style.transition = "opacity 0.22s ease, transform 0.22s ease, filter 0.22s ease";
    app.style.opacity = "0";
    app.style.transform = "scale(0.984) translateZ(0)";
    app.style.filter = "blur(2px)";
    await new Promise<void>((r) => setTimeout(r, 210));
    app.style.transition = "";
    app.style.opacity = "";
    app.style.transform = "";
    app.style.filter = "";
  }

  runCleanup();

  app.classList.toggle("app--studio", route === "studio");
  document.body.classList.toggle("route-studio", route === "studio");
  document.body.classList.toggle("route-gallery", route === "gallery");

  if (route === "studio") {
    document.title = `${portfolio.chaosStudio.title} · Packages & Services`;
    app.innerHTML = renderStudioPage(portfolio);
  } else if (route === "gallery") {
    document.title = `${portfolio.chaosStudio.title} · Gallery`;
    app.innerHTML = renderGalleryPage(portfolio);
  } else {
    document.title = `${portfolio.profile.name} · Graphic Design Portfolio`;
    app.innerHTML = renderPage(portfolio);
  }

  await exitLoadingScreen(app);

  if (!firstMount) {
    app.classList.add("page-enter");
    requestAnimationFrame(() => requestAnimationFrame(() => app.classList.remove("page-enter")));
  }
  firstMount = false;

  cleanups.push(initTheme());
  cleanups.push(
    onVisibilityChange((visible) => {
      document.body.classList.toggle("perf-paused", !visible);
    }),
  );
  cleanups.push(initMouseEffects());
  cleanups.push(initCanvasBackground());
  cleanups.push(initScrollAnimations());
  cleanups.push(initHeaderScroll());
  cleanups.push(bindRouteLinks());
  cleanups.push(bindMobileNav());

  if (route === "portfolio") {
    cleanups.push(initWorkMarquee());
    cleanups.push(initInteractions());
    cleanups.push(bindNav());
    cleanups.push(bindPrintPortfolio(portfolio.profile.name));
  } else if (route === "gallery") {
    cleanups.push(initStudioInteractions());
    cleanups.push(initPostLightbox());
    cleanups.push(initGalleryPanorama(portfolio));
    cleanups.push(bindNav());
  } else {
    cleanups.push(initStudioInteractions());
    cleanups.push(bindNav());
  }
}

function bindRouteLinks(): () => void {
  const links = document.querySelectorAll<HTMLAnchorElement>("[data-route-link]");
  const handler = (e: Event) => {
    const link = e.currentTarget as HTMLAnchorElement;
    const href = link.getAttribute("href");
    if (!href) return;
    e.preventDefault();
    const route: AppRoute =
      href === "/studio" || href.endsWith("/studio")
        ? "studio"
        : href === "/gallery" || href.endsWith("/gallery")
        ? "gallery"
        : "portfolio";
    navigateTo(route);
    void mount(route);
    closeMobileNav();
    window.scrollTo(0, 0);
  };
  links.forEach((link) => link.addEventListener("click", handler));
  return () => links.forEach((link) => link.removeEventListener("click", handler));
}

function bindNav(): () => void {
  const links = document.querySelectorAll('.nav a[href^="#"], .nav-drawer a[href^="#"]');
  const handler = (e: Event) => {
    const link = e.currentTarget as HTMLAnchorElement;
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMobileNav();
    }
  };
  links.forEach((link) => link.addEventListener("click", handler));
  return () => links.forEach((link) => link.removeEventListener("click", handler));
}

function closeMobileNav(): void {
  const drawer = document.getElementById("nav-drawer");
  const toggle = document.getElementById("nav-toggle");
  if (!drawer || !toggle) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("hidden", "");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open menu");
  document.body.classList.remove("nav-open");
}

function bindMobileNav(): () => void {
  const toggle = document.getElementById("nav-toggle");
  const drawer = document.getElementById("nav-drawer");
  if (!toggle || !drawer) return () => {};

  const open = () => {
    drawer.classList.add("is-open");
    drawer.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("nav-open");
  };

  const onToggle = () => {
    if (drawer.classList.contains("is-open")) closeMobileNav();
    else open();
  };

  toggle.addEventListener("click", onToggle);
  drawer.querySelectorAll("[data-nav-close]").forEach((el) => {
    el.addEventListener("click", closeMobileNav);
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeMobileNav();
  };
  window.addEventListener("keydown", onKey);

  const mq = window.matchMedia("(min-width: 900px)");
  const onMq = () => {
    if (mq.matches) closeMobileNav();
  };
  mq.addEventListener("change", onMq);

  return () => {
    toggle.removeEventListener("click", onToggle);
    window.removeEventListener("keydown", onKey);
    mq.removeEventListener("change", onMq);
    document.body.classList.remove("nav-open");
  };
}

function bindPrintPortfolio(profileName: string): () => void {
  const btn = document.getElementById("print-portfolio") as HTMLButtonElement | null;
  if (!btn) return () => {};

  const handler = async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.classList.add("is-loading");
    try {
      await downloadPortfolioPdf(profileName);
    } catch (err) {
      console.error(err);
      alert("Could not create PDF. Try again or use your browser Print → Save as PDF.");
    } finally {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.classList.remove("is-loading");
    }
  };

  btn.addEventListener("click", handler);
  return () => btn.removeEventListener("click", handler);
}

async function init(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  mountLoadingScreen(app);

  try {
    portfolio = await fetchPortfolio();
    const onPopState = () => {
      void mount(getRoute());
    };
    window.addEventListener("popstate", onPopState);
    cleanups.push(() => window.removeEventListener("popstate", onPopState));

    await mount(getRoute());
  } catch (err) {
    console.error(err);
    app.innerHTML =
      '<p class="load-error">Could not load portfolio. Please refresh or try again later.</p>';
  }
}

init();
