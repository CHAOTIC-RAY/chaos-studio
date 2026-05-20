import "./styles/index.css";
import { fetchPortfolio, submitContact } from "./api";
import { initCanvasBackground } from "./background/canvas-bg";
import { initInteractions } from "./interactions";
import { initMouseEffects } from "./mouse/mouse-effects";
import { initHeaderScroll, initScrollAnimations } from "./motion/scroll";
import { initWorkMarquee } from "./motion/work-marquee";
import { downloadPortfolioPdf } from "./pdf-export";
import { renderPage } from "./render";
import { initTheme } from "./theme";

async function init(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  try {
    const portfolio = await fetchPortfolio();
    document.title = `${portfolio.profile.name} · Graphic Design Portfolio`;
    app.innerHTML = renderPage(portfolio);
    app.classList.remove("loading-screen");

    const cleanups: (() => void)[] = [];
    cleanups.push(initTheme());
    cleanups.push(initMouseEffects());
    cleanups.push(initCanvasBackground());
    cleanups.push(initScrollAnimations());
    cleanups.push(initWorkMarquee());
    cleanups.push(initHeaderScroll());
    cleanups.push(initInteractions());
    cleanups.push(bindNav());
    cleanups.push(bindMobileNav());
    cleanups.push(bindContactForm());
    cleanups.push(bindPrintPortfolio(portfolio.profile.name));

    window.addEventListener("beforeunload", () => cleanups.forEach((fn) => fn()));
  } catch (err) {
    console.error(err);
    app.innerHTML =
      '<p class="load-error">Could not load portfolio. Please refresh or try again later.</p>';
  }
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

function bindContactForm(): () => void {
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  const feedback = document.getElementById("form-feedback");
  if (!form) return () => {};

  const handler = async (e: Event) => {
    e.preventDefault();
    if (!feedback) return;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name || !email || !message) {
      feedback.textContent = "Please fill in all fields.";
      feedback.className = "form-feedback error";
      return;
    }
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    btn.disabled = true;
    feedback.textContent = "Sending…";
    try {
      const res = await submitContact({ name, email, message });
      feedback.textContent = res.message;
      feedback.className = "form-feedback ok";
      form.reset();
    } catch {
      feedback.textContent = "Could not send. Try again.";
      feedback.className = "form-feedback error";
    } finally {
      btn.disabled = false;
    }
  };

  form.addEventListener("submit", handler);
  return () => form.removeEventListener("submit", handler);
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

init();
