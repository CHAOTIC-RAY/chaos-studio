import { prefersReducedMotion } from "./motion/reduced-motion";

export function initInteractions(): () => void {
  const cleanups: (() => void)[] = [];
  if (!prefersReducedMotion()) {
    cleanups.push(initMagnetic());
  }
  cleanups.push(initPostsRail());
  cleanups.push(initActiveNav());
  cleanups.push(initPostImageFallback());
  cleanups.push(initPostVideos());
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

function initPostsRail(): () => void {
  const viewport = document.querySelector(".posts-viewport") as HTMLElement | null;
  const track = document.querySelector(".posts-track") as HTMLElement | null;
  const prev = document.querySelector(".posts-rail__btn--prev") as HTMLButtonElement | null;
  const next = document.querySelector(".posts-rail__btn--next") as HTMLButtonElement | null;
  if (!track) return () => {};

  let x = 0;
  let raf = 0;
  let paused = false;
  let pauseTimer = 0;
  const speed = 0.45;
  const autoScroll = !prefersReducedMotion();

  const applyTransform = () => {
    track.style.transform = `translateX(${x}px)`;
  };

  const pauseBriefly = (ms = 2600) => {
    paused = true;
    window.clearTimeout(pauseTimer);
    pauseTimer = window.setTimeout(() => {
      paused = false;
    }, ms);
  };

  const stepPx = () => {
    const card = track.querySelector<HTMLElement>(".post-card");
    const group = track.querySelector<HTMLElement>(".posts-group");
    const el = card ?? group;
    if (!el) return 340;
    const gap = 20;
    return el.offsetWidth + gap;
  };

  const nudge = (direction: -1 | 1) => {
    x += direction * stepPx();
    applyTransform();
    pauseBriefly();
  };

  const onPrev = () => nudge(1);
  const onNext = () => nudge(-1);

  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);

  const loop = () => {
    if (autoScroll && !paused) {
      x -= speed;
      const half = track.scrollWidth / 2;
      if (half > 0 && Math.abs(x) >= half) x = 0;
      applyTransform();
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
    if ((e.target as HTMLElement).closest("button, a")) return;
    isDown = true;
    paused = true;
    startX = e.clientX;
    startTx = x;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport?.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    x = startTx + (e.clientX - startX);
    applyTransform();
  });
  const endDrag = (e: PointerEvent) => {
    if (!isDown) return;
    isDown = false;
    pauseBriefly(1200);
    try {
      viewport?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  viewport?.addEventListener("pointerup", endDrag);
  viewport?.addEventListener("pointercancel", endDrag);

  if (autoScroll) raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(pauseTimer);
    prev?.removeEventListener("click", onPrev);
    next?.removeEventListener("click", onNext);
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
    const imageBase = img.dataset.imageBase || id;
    if (!id || !imageBase) return;
    const placeholder = `/images/posts/_placeholders/${id}.svg`;
    const sources = [".webp", ".jpg", ".png"].map((ext) => `/images/posts/${imageBase}${ext}`);
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

function initPostVideos(): () => void {
  const cleanups: Array<() => void> = [];
  document.querySelectorAll<HTMLVideoElement>(".post-card__video").forEach((video) => {
    const card = video.closest(".post-card");
    if (!card) return;

    const play = () => {
      video.play().catch(() => {});
    };
    const stop = () => {
      video.pause();
      video.currentTime = 0;
    };

    card.addEventListener("mouseenter", play);
    card.addEventListener("mouseleave", stop);
    card.addEventListener("focusin", play);
    card.addEventListener("focusout", stop);

    cleanups.push(() => {
      card.removeEventListener("mouseenter", play);
      card.removeEventListener("mouseleave", stop);
      card.removeEventListener("focusin", play);
      card.removeEventListener("focusout", stop);
    });
  });
  return () => cleanups.forEach((fn) => fn());
}
