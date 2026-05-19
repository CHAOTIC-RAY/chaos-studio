import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./reduced-motion";

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations(): () => void {
  if (prefersReducedMotion()) {
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      (el as HTMLElement).style.opacity = "1";
      (el as HTMLElement).style.transform = "none";
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }

  const ctx = gsap.context(() => {
    gsap.from(".hero-eyebrow", {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power3.out",
    });

    gsap.from(".hero-line", {
      opacity: 0,
      y: 56,
      duration: 1,
      stagger: 0.12,
      ease: "power3.out",
      delay: 0.15,
    });

    gsap.from(".hero-tagline", {
      opacity: 0,
      y: 24,
      duration: 0.9,
      ease: "power3.out",
      delay: 0.5,
    });

    gsap.from(".hero-actions", {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.7,
    });

    gsap.from(".scroll-cue", {
      opacity: 0,
      duration: 0.6,
      delay: 1.2,
    });

    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        y: 48,
        duration: 0.9,
        ease: "power3.out",
      });
    });

    gsap.utils.toArray<HTMLElement>(".project-card").forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        y: 40,
        scale: 0.98,
        duration: 0.75,
        delay: (i % 3) * 0.08,
        ease: "power3.out",
      });
    });

    const portrait = document.querySelector(".about-portrait-wrap");
    if (portrait) {
      gsap.to(portrait, {
        scrollTrigger: {
          trigger: portrait,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
        yPercent: -8,
        ease: "none",
      });
    }
  });

  return () => {
    ctx.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
}

export function initHeaderScroll(): () => void {
  const header = document.querySelector(".site-header");
  if (!header) return () => {};

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 60);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
