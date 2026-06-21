import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./reduced-motion";
import { initCountUpAnimations } from "./count-up";

gsap.registerPlugin(ScrollTrigger);

/** Reveal elements on scroll — content stays visible if GSAP fails */
export function initScrollAnimations(): () => void {
  const revealEls = document.querySelectorAll<HTMLElement>("[data-reveal]");

  if (prefersReducedMotion()) {
    revealEls.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return () => ScrollTrigger.getAll().forEach((t: ScrollTrigger) => t.kill());
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

    // Animate stat cards
    const statCards = gsap.utils.toArray<HTMLElement>(".stat-card");
    if (statCards.length) {
      gsap.fromTo(
        statCards,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".stats-grid",
            start: "top 85%",
            once: true,
          },
        },
      );
    }

    // Animate award cards
    const awardCards = gsap.utils.toArray<HTMLElement>(".award-card");
    if (awardCards.length) {
      gsap.fromTo(
        awardCards,
        { opacity: 0, x: -24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".awards-list",
            start: "top 85%",
            once: true,
          },
        },
      );
    }

    // Animate news cards
    const newsCards = gsap.utils.toArray<HTMLElement>(".news-card");
    if (newsCards.length) {
      gsap.fromTo(
        newsCards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".news-grid",
            start: "top 85%",
            once: true,
          },
        },
      );
    }

    // Animate testimonial cards
    const testimonialCards = gsap.utils.toArray<HTMLElement>(".testimonial-card");
    if (testimonialCards.length) {
      gsap.fromTo(
        testimonialCards,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".testimonials-grid",
            start: "top 85%",
            once: true,
          },
        },
      );
    }

    // Animate process steps
    const processSteps = gsap.utils.toArray<HTMLElement>(".process-step");
    if (processSteps.length) {
      gsap.fromTo(
        processSteps,
        { opacity: 0, x: -32 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".process-steps",
            start: "top 85%",
            once: true,
          },
        },
      );
    }

    // Animate client logos
    const clientLogos = gsap.utils.toArray<HTMLElement>(".client-logo-item");
    if (clientLogos.length) {
      gsap.fromTo(
        clientLogos,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".client-logos-grid",
            start: "top 85%",
            once: true,
          },
        },
      );
    }

    // Initialize count-up animations
    initCountUpAnimations();
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    ctx.revert();
    ScrollTrigger.getAll().forEach((t: ScrollTrigger) => t.kill());
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
