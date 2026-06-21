import { observeInView } from "./motion/perf";
import { prefersReducedMotion } from "./motion/reduced-motion";
import { initStudioScrollEffect } from "./motion/studio-scroll";
import { initPostLightbox } from "./post-lightbox";
import { initPanoTilt } from "./mouse/mouse-effects";

export function initInteractions(): () => void {
  const cleanups: (() => void)[] = [];
  if (!prefersReducedMotion()) {
    cleanups.push(initMagnetic());
    cleanups.push(initPanoTilt());
  }
  cleanups.push(initPostsRail());
  cleanups.push(initPostsPanel());
  cleanups.push(initPostsExpandedFeed());
  cleanups.push(initPostsFeedTabs());
  cleanups.push(initActiveNav());
  cleanups.push(initPostImageFallback());
  cleanups.push(initPostVideos());
  cleanups.push(initPostCarousels());
  cleanups.push(initPostFilmstripCounters());
  cleanups.push(initPostLightbox());
  return () => cleanups.forEach((fn) => fn());
}

const POST_CAROUSEL_MS = 3400;

function initPostCarousels(): () => void {
  if (prefersReducedMotion()) return () => {};

  const cleanups: (() => void)[] = [];

  document.querySelectorAll<HTMLElement>(".post-card__carousel").forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll<HTMLElement>(".post-card__slide"));
    if (slides.length < 2) return;

    carousel.classList.add("post-card__carousel--js");

    let index = 0;
    const counter = carousel.querySelector<HTMLElement>("[data-slide-counter]");
    const setActive = (next: number) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === next);
        slide.style.opacity = i === next ? "1" : "0";
        slide.style.zIndex = i === next ? "1" : "0";
      });
      if (counter) counter.textContent = `${next + 1} / ${slides.length}`;
    };

    setActive(0);

    let timer = 0;
    const start = () => {
      if (timer) return;
      timer = window.setInterval(() => {
        index = (index + 1) % slides.length;
        setActive(index);
      }, POST_CAROUSEL_MS);
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
    };

    start();
    cleanups.push(observeInView(carousel, start, stop, 0.12));
    cleanups.push(stop);
  });

  return () => cleanups.forEach((fn) => fn());
}

function initPostFilmstripCounters(): () => void {
  const cleanups: (() => void)[] = [];

  document.querySelectorAll<HTMLElement>("[data-filmstrip]").forEach((wrap) => {
    const track = wrap.querySelector<HTMLElement>(".post-card__filmstrip-track");
    const counter = wrap.querySelector<HTMLElement>("[data-slide-counter]");
    const slides = track
      ? Array.from(track.querySelectorAll<HTMLElement>(".post-card__filmstrip-slide"))
      : [];
    if (!track || !counter || slides.length < 2) return;

    let raf = 0;
    const update = () => {
      const center = track.scrollLeft + track.clientWidth * 0.35;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((slide, i) => {
        const dist = Math.abs(slide.offsetLeft - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      counter.textContent = `${best + 1} / ${slides.length}`;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    update();
    cleanups.push(() => track.removeEventListener("scroll", onScroll));
    cleanups.push(() => cancelAnimationFrame(raf));
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Studio page: magnetic buttons + in-page nav highlights only */
export function initStudioInteractions(): () => void {
  const cleanups: (() => void)[] = [];
  cleanups.push(initStudioScrollEffect());
  if (!prefersReducedMotion()) {
    cleanups.push(initMagnetic());
    cleanups.push(initPanoTilt());
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
  const autoAdvance = !reduced;
  const TRANSITION_MS = 520;
  const PAUSE_AFTER_INTERACT_MS = 2800;
  const SCROLL_PX_PER_SEC = 38;

  let x = 0;
  let paused = false;
  let pauseTimer = 0;
  let transitionTimer = 0;
  let raf = 0;
  let lastTime = performance.now();
  let animating = false;

  const groups = () => Array.from(track.querySelectorAll<HTMLElement>(".posts-group"));
  const loopGroups = () => {
    const all = groups();
    const half = Math.max(1, Math.floor(all.length / 2));
    return all.slice(0, half);
  };

  const offsetInTrack = (el: HTMLElement) => {
    let pos = 0;
    let cur: HTMLElement | null = el;
    while (cur && cur !== track) {
      pos += cur.offsetLeft;
      cur = cur.offsetParent as HTMLElement | null;
    }
    return pos;
  };

  const snapOffsets = () => loopGroups().map((group) => offsetInTrack(group));

  const applyTransform = (animate = false) => {
    if (animate && !reduced) {
      track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(() => {
        track.style.transition = "";
        animating = false;
      }, TRANSITION_MS + 40);
    } else {
      track.style.transition = "";
      animating = false;
    }
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  const loopHalf = () => Math.max(1, track.scrollWidth / 2);

  const normalizeX = () => {
    const half = loopHalf();
    while (-x >= half - 1) x += half;
    while (x > 1) x -= half;
  };

  const nearestIndex = () => {
    const offsets = snapOffsets();
    if (!offsets.length) return 0;
    normalizeX();
    const pos = -x;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    offsets.forEach((off, i) => {
      const dist = Math.abs(off - pos);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const goToIndex = (index: number, animate = false) => {
    const offsets = snapOffsets();
    const len = offsets.length;
    if (!len) return;
    const i = ((index % len) + len) % len;
    x = -offsets[i];
    normalizeX();
    if (animate) animating = true;
    applyTransform(animate);
  };

  const step = (direction: -1 | 1) => {
    const offsets = snapOffsets();
    if (!offsets.length) return;
    const next = nearestIndex() + direction;
    goToIndex(next, !reduced);
    pauseBriefly(PAUSE_AFTER_INTERACT_MS);
  };

  const pauseBriefly = (ms = PAUSE_AFTER_INTERACT_MS) => {
    paused = true;
    window.clearTimeout(pauseTimer);
    pauseTimer = window.setTimeout(() => {
      if (!hoverPause && !isDown) paused = false;
    }, ms);
  };

  const isExpanded = () =>
    document.querySelector("[data-posts-panel]")?.classList.contains("posts-panel--expanded");

  let hoverPause = false;
  let railInView = true;
  let isDown = false;
  let playing = false;

  const tick = (now: number) => {
    if (!playing) {
      raf = 0;
      return;
    }
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (
      autoAdvance &&
      railInView &&
      !paused &&
      !hoverPause &&
      !isDown &&
      !isExpanded() &&
      !document.body.classList.contains("lightbox-open") &&
      !animating &&
      loopHalf() > 1
    ) {
      x -= SCROLL_PX_PER_SEC * dt;
      normalizeX();
      applyTransform(false);
    }

    raf = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    playing = true;
    lastTime = performance.now();
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    playing = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onPrevClick = (e: Event) => {
    e.preventDefault();
    step(-1);
  };
  const onNextClick = (e: Event) => {
    e.preventDefault();
    step(1);
  };
  prev?.addEventListener("click", onPrevClick);
  next?.addEventListener("click", onNextClick);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  };
  viewport.addEventListener("keydown", onKey);

  const pause = () => {
    paused = true;
    window.clearTimeout(pauseTimer);
  };

  viewport.addEventListener("mouseenter", () => {
    hoverPause = true;
    pause();
  });
  viewport.addEventListener("mouseleave", () => {
    hoverPause = false;
    pauseBriefly(600);
  });
  viewport.addEventListener("focusin", pause);
  viewport.addEventListener("focusout", () => {
    if (!hoverPause) pauseBriefly(600);
  });

  let startX = 0;
  let startTx = 0;

  viewport.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (reduced) return;
    isDown = true;
    paused = true;
    animating = false;
    track.style.transition = "";
    startX = e.clientX;
    startTx = x;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!isDown || reduced) return;
    x = startTx + (e.clientX - startX);
    applyTransform(false);
  });
  const endDrag = (e: PointerEvent) => {
    if (!isDown) return;
    isDown = false;
    goToIndex(nearestIndex(), !reduced);
    pauseBriefly(PAUSE_AFTER_INTERACT_MS);
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  const onResize = () => goToIndex(nearestIndex(), false);
  window.addEventListener("resize", onResize);

  const onMediaReady = () => goToIndex(nearestIndex(), false);
  track.querySelectorAll("img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", onMediaReady, { once: true });
  });

  goToIndex(0, false);
  if (autoAdvance) startLoop();

  const unobserveRail = observeInView(
    carousel,
    () => {
      railInView = true;
      if (autoAdvance) startLoop();
    },
    () => {
      railInView = false;
      stopLoop();
    },
    0.04,
  );

  return () => {
    unobserveRail();
    stopLoop();
    window.clearTimeout(pauseTimer);
    window.clearTimeout(transitionTimer);
    window.removeEventListener("resize", onResize);
    prev?.removeEventListener("click", onPrevClick);
    next?.removeEventListener("click", onNextClick);
    viewport.removeEventListener("keydown", onKey);
    track.style.transform = "";
    track.style.transition = "";
  };
}

function initPostsFeedTabs(): () => void {
  const wrap = document.querySelector<HTMLElement>("[data-posts-tabs-wrap]");
  const tabs = document.querySelector<HTMLElement>("[data-posts-tabs]");
  const prev = document.querySelector<HTMLButtonElement>("[data-posts-tabs-prev]");
  const next = document.querySelector<HTMLButtonElement>("[data-posts-tabs-next]");
  if (!tabs) return () => {};

  const updateEdges = () => {
    const scrollable = tabs.scrollWidth > tabs.clientWidth + 2;
    wrap?.classList.toggle("posts-feed__tabs-wrap--scrollable", scrollable);
    const atStart = tabs.scrollLeft <= 2;
    const atEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 2;
    wrap?.classList.toggle("posts-feed__tabs-wrap--start", atStart);
    wrap?.classList.toggle("posts-feed__tabs-wrap--end", atEnd);
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
  };

  const scrollBy = (delta: number) => {
    tabs.scrollBy({ left: delta, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const onWheel = (e: WheelEvent) => {
    if (tabs.scrollWidth <= tabs.clientWidth + 2) return;
    const dominantVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
    if (!dominantVertical) return;
    e.preventDefault();
    tabs.scrollLeft += e.deltaY;
    updateEdges();
  };

  const onScroll = () => updateEdges();
  tabs.addEventListener("wheel", onWheel, { passive: false });
  tabs.addEventListener("scroll", onScroll, { passive: true });

  const onPrev = (e: Event) => {
    e.preventDefault();
    scrollBy(-Math.max(180, tabs.clientWidth * 0.55));
  };
  const onNext = (e: Event) => {
    e.preventDefault();
    scrollBy(Math.max(180, tabs.clientWidth * 0.55));
  };
  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);

  const ro = new ResizeObserver(() => updateEdges());
  ro.observe(tabs);
  updateEdges();

  return () => {
    ro.disconnect();
    tabs.removeEventListener("wheel", onWheel);
    tabs.removeEventListener("scroll", onScroll);
    prev?.removeEventListener("click", onPrev);
    next?.removeEventListener("click", onNext);
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

  const tabs = Array.from(feed.querySelectorAll<HTMLButtonElement>("[data-posts-tab]"));
  const panels = Array.from(feed.querySelectorAll<HTMLElement>("[data-posts-tab-panel]"));
  if (!tabs.length || !panels.length) return () => {};

  const activate = (slug: string) => {
    tabs.forEach((tab) => {
      const on = tab.getAttribute("data-posts-tab") === slug;
      tab.classList.toggle("posts-feed__tab--active", on);
      tab.setAttribute("aria-selected", String(on));
    });
    panels.forEach((panel) => {
      const on = panel.getAttribute("data-posts-tab-panel") === slug;
      panel.classList.toggle("posts-feed__panel--active", on);
      panel.hidden = !on;
    });
  };

  const cleanups: Array<() => void> = [];
  tabs.forEach((tab) => {
    const onClick = () => {
      const slug = tab.getAttribute("data-posts-tab");
      if (slug) activate(slug);
    };
    tab.addEventListener("click", onClick);
    cleanups.push(() => tab.removeEventListener("click", onClick));
  });

  const first = tabs[0]?.getAttribute("data-posts-tab");
  if (first) activate(first);

  return () => cleanups.forEach((fn) => fn());
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
