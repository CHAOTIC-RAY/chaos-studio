import { prefersReducedMotion } from "./motion/reduced-motion";

export function initInteractions(): () => void {
  const cleanups: (() => void)[] = [];
  if (!prefersReducedMotion()) {
    cleanups.push(initMagnetic());
    cleanups.push(initPostsMarquee());
  }
  cleanups.push(initActiveNav());
  cleanups.push(initPostImageFallback());
  return () => cleanups.forEach((fn) => fn());
}

function initMagnetic(): () => void {
  const els = document.querySelectorAll<HTMLElement>("[data-magnetic]");
  const pairs: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];
  els.forEach((el) => {
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.14}px, ${(e.clientY - r.top - r.height / 2) * 0.14}px)`;
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    pairs.push({ el, move, leave });
  });
  return () =>
    pairs.forEach(({ el, move, leave }) => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    });
}

function initPostsMarquee(): () => void {
  const viewport = document.querySelector(".posts-viewport") as HTMLElement | null;
  const track = document.querySelector(".posts-track") as HTMLElement | null;
  if (!track) return () => {};

  let x = 0;
  let raf = 0;
  let paused = false;
  const speed = 0.45;

  const loop = () => {
    if (!paused) {
      x -= speed;
      const half = track.scrollWidth / 2;
      if (half > 0 && Math.abs(x) >= half) x = 0;
      track.style.transform = `translateX(${x}px)`;
    }
    raf = requestAnimationFrame(loop);
  };

  const pause = () => {
    paused = true;
  };
  const resume = () => {
    paused = false;
  };

  viewport?.addEventListener("mouseenter", pause);
  viewport?.addEventListener("mouseleave", resume);
  viewport?.addEventListener("focusin", pause);
  viewport?.addEventListener("focusout", resume);

  let isDown = false;
  let startX = 0;
  let startTx = 0;

  viewport?.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("a")) return;
    isDown = true;
    paused = true;
    startX = e.clientX;
    startTx = x;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport?.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    x = startTx + (e.clientX - startX);
    track.style.transform = `translateX(${x}px)`;
  });
  const endDrag = (e: PointerEvent) => {
    if (!isDown) return;
    isDown = false;
    paused = false;
    try {
      viewport?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  viewport?.addEventListener("pointerup", endDrag);
  viewport?.addEventListener("pointercancel", endDrag);

  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    viewport?.removeEventListener("mouseenter", pause);
    viewport?.removeEventListener("mouseleave", resume);
  };
}

function initActiveNav(): () => void {
  const links = document.querySelectorAll<HTMLAnchorElement>(".nav a[href^='#']");
  const sections = Array.from(links)
    .map((a) => {
      const id = a.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      return el ? { id, el, link: a } : null;
    })
    .filter(Boolean) as { id: string; el: HTMLElement; link: HTMLAnchorElement }[];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const match = sections.find((s) => s.el === entry.target);
          if (match) {
            links.forEach((l) => l.classList.remove("nav__link--active"));
            match.link.classList.add("nav__link--active");
          }
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
  );

  sections.forEach((s) => observer.observe(s.el));
  return () => observer.disconnect();
}

/** Try webp → jpg → png → placeholder SVG */
function initPostImageFallback(): () => void {
  const imgs = document.querySelectorAll<HTMLImageElement>(".post-card__img[data-post-id]");
  imgs.forEach((img) => {
    const id = img.dataset.postId;
    if (!id) return;
    const placeholder = `/images/posts/_placeholders/${id}.svg`;
    const sources = [".webp", ".jpg", ".png"].map((ext) => `/images/posts/${id}${ext}`);
    let i = 0;
    img.onerror = () => {
      i += 1;
      if (i < sources.length) img.src = sources[i];
      else img.src = placeholder;
    };
    if (!img.getAttribute("src")) img.src = sources[0];
  });
  return () => {};
}
