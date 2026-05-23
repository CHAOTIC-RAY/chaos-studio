import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./reduced-motion";

gsap.registerPlugin(ScrollTrigger);

/** Reveal elements on scroll — content stays visible if GSAP fails */
export function initScrollAnimations(): () => void {
  const revealEls = document.querySelectorAll<HTMLElement>("[data-reveal]");

  if (prefersReducedMotion()) {
    revealEls.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }

  const ctx = gsap.context(() => {
    gsap.from(".hero-eyebrow", { opacity: 0, y: 16, duration: 0.7, ease: "power3.out" });
    gsap.from(".hero-line", {
      opacity: 0,
      y: 48,
      duration: 0.9,
      stagger: 0.1,
      ease: "power3.out",
      delay: 0.1,
    });
    gsap.from(".hero-sub", { opacity: 0, y: 20, duration: 0.8, ease: "power3.out", delay: 0.35 });
    gsap.from(".hero-actions", { opacity: 0, y: 16, duration: 0.7, ease: "power3.out", delay: 0.5 });
    gsap.from(".scroll-cue", { opacity: 0, duration: 0.5, delay: 0.9 });

    revealEls.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            once: true,
            toggleActions: "play none none none",
          },
        },
      );
    });

    const postsViewport = document.querySelector(".posts-viewport");
    const postCards = gsap.utils.toArray<HTMLElement>(".posts-rail .post-card");
    if (postsViewport && postCards.length) {
      gsap.fromTo(
        postCards,
        { opacity: 0, x: 24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.035,
          ease: "power3.out",
          scrollTrigger: {
            trigger: postsViewport,
            start: "top 88%",
            once: true,
          },
        },
      );
    }
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    ctx.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
}

export function initHeaderScroll(): () => void {
  const header = document.querySelector(".site-header");
  if (!header) return () => {};
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 48);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
