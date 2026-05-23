import { prefersReducedMotion } from "./motion/reduced-motion";
import { initPostLightbox } from "./post-lightbox";

export function initInteractions(): () => void {
  const cleanups: (() => void)[] = [];
  if (!prefersReducedMotion()) {
    cleanups.push(initMagnetic());
  }
  cleanups.push(initPostsRail());
  cleanups.push(initPostsPanel());
  cleanups.push(initPostsExpandedFeed());
  cleanups.push(initActiveNav());
  cleanups.push(initPostImageFallback());
  cleanups.push(initPostVideos());
  cleanups.push(initPostCarousels());
  cleanups.push(initPostLightbox());
  return () => cleanups.forEach((fn) => fn());
}

const POST_CAROUSEL_MS = 3400;

function initPostCarousels(): () => void {
  if (prefersReducedMotion()) return () => {};

  const timers: number[] = [];

  document.querySelectorAll<HTMLElement>(".post-card__carousel").forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll<HTMLElement>(".post-card__slide"));
    if (slides.length < 2) return;

    carousel.classList.add("post-card__carousel--js");

    let index = 0;
    const setActive = (next: number) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === next);
        slide.style.opacity = i === next ? "1" : "0";
        slide.style.zIndex = i === next ? "1" : "0";
      });
    };

    setActive(0);

    timers.push(
      window.setInterval(() => {
        index = (index + 1) % slides.length;
        setActive(index);
      }, POST_CAROUSEL_MS),
    );
  });

  return () => timers.forEach((t) => window.clearInterval(t));
}

/** Studio page: magnetic buttons + in-page nav highlights only */
export function initStudioInteractions(): () => void {
  const cleanups: (() => void)[] = [];
  if (!prefersReducedMotion()) {
    cleanups.push(initMagnetic());
  }
  cleanups.push(initActiveNav());
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
  const carousel = document.querySelector("[data-posts-carousel]");
  const viewport = carousel?.querySelector(".posts-viewport") as HTMLElement | null;
  const track = carousel?.querySelector(".posts-track") as HTMLElement | null;
  const prev = carousel?.querySelector(".posts-rail__btn--prev") as HTMLButtonElement | null;
  const next = carousel?.querySelector(".posts-rail__btn--next") as HTMLButtonElement | null;
  if (!viewport || !track) return () => {};

  const reduced = prefersReducedMotion();
  const autoScroll = !reduced;

  let x = 0;
  let raf = 0;
  let paused = false;
  let pauseTimer = 0;
  const speed = 0.45;

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
    const vw = viewport.clientWidth;
    if (vw > 0) return Math.max(280, vw * 0.72);
    const card = track.querySelector<HTMLElement>(".post-card");
    if (!card) return 320;
    return card.offsetWidth + 20;
  };

  const scrollNative = (direction: -1 | 1) => {
    viewport.scrollBy({ left: direction * stepPx(), behavior: reduced ? "auto" : "smooth" });
  };

  const nudge = (direction: -1 | 1) => {
    if (reduced) {
      scrollNative(direction);
      return;
    }
    x += direction * stepPx();
    applyTransform();
    pauseBriefly();
  };

  const onPrev = () => nudge(-1);
  const onNext = () => nudge(1);

  const onPrevClick = (e: Event) => {
    e.preventDefault();
    onPrev();
  };
  const onNextClick = (e: Event) => {
    e.preventDefault();
    onNext();
  };
  prev?.addEventListener("click", onPrevClick);
  next?.addEventListener("click", onNextClick);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onNext();
    }
  };
  viewport.addEventListener("keydown", onKey);

  const loop = () => {
    const panel = document.querySelector("[data-posts-panel]");
    if (panel?.classList.contains("posts-panel--expanded")) {
      raf = requestAnimationFrame(loop);
      return;
    }
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

  viewport.addEventListener("mouseenter", pause);
  viewport.addEventListener("mouseleave", resume);
  viewport.addEventListener("focusin", pause);
  viewport.addEventListener("focusout", resume);

  let isDown = false;
  let startX = 0;
  let startTx = 0;

  viewport.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (reduced) return;
    isDown = true;
    paused = true;
    startX = e.clientX;
    startTx = x;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!isDown || reduced) return;
    x = startTx + (e.clientX - startX);
    applyTransform();
  });
  const endDrag = (e: PointerEvent) => {
    if (!isDown) return;
    isDown = false;
    pauseBriefly(1200);
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  if (autoScroll) raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(pauseTimer);
    prev?.removeEventListener("click", onPrevClick);
    next?.removeEventListener("click", onNextClick);
    viewport.removeEventListener("keydown", onKey);
    viewport.removeEventListener("mouseenter", pause);
    viewport.removeEventListener("mouseleave", resume);
  };
}

function initPostsPanel(): () => void {
  const panel = document.querySelector("[data-posts-panel]") as HTMLElement | null;
  const btn = document.querySelector("[data-posts-expand]") as HTMLButtonElement | null;
  const expanded = document.querySelector("[data-posts-expanded]") as HTMLElement | null;
  const label = btn?.querySelector(".posts-panel__toggle-label");
  if (!panel || !btn || !expanded) return () => {};

  const setExpanded = (on: boolean) => {
    panel.classList.toggle("posts-panel--expanded", on);
    panel.classList.toggle("posts-panel--collapsed", !on);
    btn.setAttribute("aria-expanded", String(on));
    expanded.hidden = !on;
    if (label) label.textContent = on ? "Back to carousel" : "Browse full feed";
    if (on) {
      expanded.querySelectorAll<HTMLVideoElement>(".post-card__video").forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
      requestAnimationFrame(() => {
        panel.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
      });
    }
  };

  const onToggle = () => setExpanded(!panel.classList.contains("posts-panel--expanded"));
  btn.addEventListener("click", onToggle);
  return () => btn.removeEventListener("click", onToggle);
}

function initPostsExpandedFeed(): () => void {
  const feed = document.querySelector("[data-posts-expanded]");
  if (!feed) return () => {};

  const chips = Array.from(feed.querySelectorAll<HTMLAnchorElement>("[data-posts-chip]"));
  const sections = Array.from(feed.querySelectorAll<HTMLElement>("[data-posts-section]"));
  if (!chips.length || !sections.length) return () => {};

  const setActive = (slug: string | null) => {
    chips.forEach((chip) => {
      const href = chip.getAttribute("href") ?? "";
      const match = slug && href === `#${slug}`;
      chip.classList.toggle("posts-feed__chip--active", Boolean(match));
      if (match) chip.setAttribute("aria-current", "true");
      else chip.removeAttribute("aria-current");
    });
  };

  const onChipClick = (e: Event) => {
    const chip = (e.currentTarget as HTMLAnchorElement).closest<HTMLAnchorElement>("[data-posts-chip]");
    if (!chip) return;
    const id = chip.getAttribute("href")?.slice(1);
    if (!id) return;
    const section = document.getElementById(id);
    if (!section) return;
    e.preventDefault();
    section.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    setActive(id);
  };

  chips.forEach((chip) => chip.addEventListener("click", onChipClick));

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const top = visible[0]?.target as HTMLElement | undefined;
      if (top?.id) setActive(top.id);
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.35] },
  );
  sections.forEach((section) => observer.observe(section));

  setActive(sections[0]?.id ?? null);

  return () => {
    chips.forEach((chip) => chip.removeEventListener("click", onChipClick));
    observer.disconnect();
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
  let unmutedVideo: HTMLVideoElement | null = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: [0, 0.4, 0.65] },
  );

  document.querySelectorAll<HTMLVideoElement>(".post-card__video").forEach((video) => {
    const card = video.closest(".post-card");
    if (!card) return;

    video.muted = true;
    observer.observe(video);

    const unmuteBtn = card.querySelector<HTMLButtonElement>(".post-card__unmute");
    const syncUnmute = () => {
      if (!unmuteBtn) return;
      unmuteBtn.setAttribute("aria-pressed", String(video.muted));
      unmuteBtn.textContent = video.muted ? "Unmute" : "Mute";
    };
    syncUnmute();

    const onUnmute = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (video.muted) {
        if (unmutedVideo && unmutedVideo !== video) {
          unmutedVideo.muted = true;
          const otherBtn = unmutedVideo.closest(".post-card")?.querySelector<HTMLButtonElement>(".post-card__unmute");
          if (otherBtn) {
            otherBtn.setAttribute("aria-pressed", "true");
            otherBtn.textContent = "Unmute";
          }
        }
        video.muted = false;
        unmutedVideo = video;
        video.play().catch(() => {});
      } else {
        video.muted = true;
        if (unmutedVideo === video) unmutedVideo = null;
      }
      syncUnmute();
    };

    unmuteBtn?.addEventListener("click", onUnmute);
    cleanups.push(() => {
      observer.unobserve(video);
      unmuteBtn?.removeEventListener("click", onUnmute);
    });
  });

  cleanups.push(() => observer.disconnect());
  return () => cleanups.forEach((fn) => fn());
}
