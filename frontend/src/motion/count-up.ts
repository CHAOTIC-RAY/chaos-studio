import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./reduced-motion";

gsap.registerPlugin(ScrollTrigger);

export function initCountUpAnimations(): () => void {
  const statCards = document.querySelectorAll<HTMLElement>("[data-stat-card]");
  
  if (prefersReducedMotion() || !statCards.length) {
    return () => {};
  }

  const ctx = gsap.context(() => {
    statCards.forEach((card) => {
      const valueEl = card.querySelector<HTMLElement>("[data-count-up]");
      if (!valueEl) return;

      const targetValue = valueEl.getAttribute("data-count-up");
      if (!targetValue) return;

      // Parse the value (handle numbers with +, %, etc.)
      const numericValue = parseFloat(targetValue.replace(/[^0-9.]/g, ""));
      const suffix = targetValue.replace(/[0-9.]/g, "");

      gsap.fromTo(
        { value: 0 },
        {
          value: numericValue,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            once: true,
          },
          onUpdate: function() {
            const current = this.targets()[0].value;
            valueEl.textContent = Math.round(current) + suffix;
          },
        },
      );
    });
  });

  return () => {
    ctx.revert();
    ScrollTrigger.getAll().forEach((t: ScrollTrigger) => t.kill());
  };
}
