import "./styles/index.css";
import { fetchPortfolio, submitContact } from "./api";
import { initCanvasBackground } from "./background/canvas-bg";
import { initInteractions } from "./interactions";
import { initMouseEffects } from "./mouse/mouse-effects";
import { initHeaderScroll, initScrollAnimations } from "./motion/scroll";
import { initWorkMarquee } from "./motion/work-marquee";
import { downloadPortfolioPdf } from "./pdf-export";
import { renderPage } from "./render";

async function init(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  try {
    const portfolio = await fetchPortfolio();
    document.title = `${portfolio.profile.name} · Graphic Design Portfolio`;
    app.innerHTML = renderPage(portfolio);
    app.classList.remove("loading-screen");

    const cleanups: (() => void)[] = [];
    cleanups.push(initMouseEffects());
    cleanups.push(initCanvasBackground());
    cleanups.push(initScrollAnimations());
    cleanups.push(initWorkMarquee());
    cleanups.push(initHeaderScroll());
    cleanups.push(initInteractions());
    cleanups.push(bindNav());
    cleanups.push(bindContactForm());
    cleanups.push(bindPdfDownload(portfolio.profile.name));

    window.addEventListener("beforeunload", () => cleanups.forEach((fn) => fn()));
  } catch (err) {
    console.error(err);
    app.innerHTML =
      '<p class="load-error">Could not load portfolio. Please refresh or try again later.</p>';
  }
}

function bindNav(): () => void {
  document.querySelectorAll('.nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = (link as HTMLAnchorElement).getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  const progress = document.querySelector(".scroll-progress") as HTMLElement | null;
  if (!progress) return () => {};
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : "0%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener("scroll", onScroll);
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

function bindPdfDownload(profileName: string): () => void {
  const btn = document.getElementById("download-pdf") as HTMLButtonElement | null;
  if (!btn) return () => {};

  const handler = async () => {
    if (btn.disabled) return;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Preparing PDF…";
    try {
      await downloadPortfolioPdf(profileName);
    } catch (err) {
      console.error(err);
      alert("Could not create PDF. Try again or use your browser Print → Save as PDF.");
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  };

  btn.addEventListener("click", handler);
  return () => btn.removeEventListener("click", handler);
}

init();
