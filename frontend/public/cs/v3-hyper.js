/* Chaos Studio V3 — Lenis + GSAP ScrollTrigger (transform/opacity only). */
(function () {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);

  const MARKS = [
    "/assets/motifs/marks/chaos-mark-a.svg",
    "/assets/motifs/marks/chaos-mark-b.svg",
    "/assets/motifs/marks/chaos-mark-c.svg",
  ];
  const SHAPES = [
    "/assets/motifs/shapes/chaos-shape-1.svg",
    "/assets/motifs/shapes/chaos-shape-3.svg",
    "/assets/motifs/shapes/chaos-shape-5.svg",
  ];
  const DOTS = [
    "/assets/motifs/dot-icons/dot-bolt.svg",
    "/assets/motifs/dot-icons/dot-target.svg",
    "/assets/motifs/dot-icons/dot-rocket.svg",
  ];

  function lenisSetup() {
    if (RM || coarse || !window.Lenis) return null;
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.15,
    });
    lenis.on("scroll", ST.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  const lenis = lenisSetup();

  function spawnMotifs() {
    const layer = document.createElement("div");
    layer.className = "v3-motif-layer";
    layer.setAttribute("aria-hidden", "true");
    const pool = [...MARKS, ...SHAPES, ...DOTS];
    const n = RM ? 4 : coarse ? 8 : 14;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div");
      el.className = "v3-motif" + (i % 3 === 0 ? " v3-motif--mark" : " v3-motif--shape");
      el.style.setProperty("--motif-size", `${48 + (i % 5) * 28}px`);
      el.style.setProperty("--motif-op", `${0.15 + (i % 4) * 0.08}`);
      el.style.left = `${(i * 17) % 100}%`;
      el.style.top = `${(i * 23 + 8) % 100}%`;
      const img = document.createElement("img");
      img.src = pool[i % pool.length];
      img.alt = "";
      img.decoding = "async";
      img.loading = "lazy";
      el.appendChild(img);
      layer.appendChild(el);
      if (!RM) {
        gsap.to(el, {
          y: () => (i % 2 ? -1 : 1) * (40 + (i % 3) * 30),
          x: () => (i % 2 ? 1 : -1) * (20 + (i % 4) * 12),
          rotation: () => (i % 2 ? 1 : -1) * 25,
          ease: "none",
          scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: coarse ? 1.2 : 0.6,
          },
        });
        gsap.to(el, {
          rotation: "+=360",
          duration: 28 + i * 2,
          repeat: -1,
          ease: "none",
        });
      }
    }
    document.body.prepend(layer);
  }

  function marqueeBand() {
    let band = document.querySelector(".v3-marquee");
    if (!band) {
      const svc = document.querySelector(".svc");
      if (!svc) return;
      band = document.createElement("div");
      band.className = "v3-marquee";
      band.setAttribute("aria-hidden", "true");
      band.innerHTML =
        '<div class="v3-marquee__track" data-marquee><span>CHAOS STUDIO <span class="shock">✱</span></span></div>';
      svc.parentElement.insertBefore(band, svc);
    }
    const track = band.querySelector("[data-marquee]");
    if (!track || track.dataset.ready) return;
    track.dataset.ready = "1";
    const chunk = track.innerHTML;
    track.innerHTML = chunk.repeat(12);
    if (RM) {
      track.style.transform = "translateX(-12%)";
      return;
    }
  const marqueeTween = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 28,
      repeat: -1,
    });
    ST.create({
      trigger: band,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity() / 800;
        marqueeTween.timeScale(1 + Math.min(2.5, Math.abs(v)) * (v < 0 ? -1 : 1));
      },
    });
  }

  function heroTypeMotion() {
    const hero = document.querySelector(".hero-h");
    if (!hero || RM) return;
    hero.querySelectorAll(".glitch, .st, .outline").forEach((node) => {
      node.classList.add("hero-split");
      gsap.fromTo(
        node,
        { skewX: -8, y: 48, scale: 0.92 },
        {
          skewX: 0,
          y: 0,
          scale: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: hero,
            start: "top 85%",
            end: "bottom 55%",
            scrub: 0.85,
          },
        },
      );
    });
    gsap.to(hero, {
      x: () => (window.innerWidth > 900 ? 24 : 0),
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  function servicesHorizontal() {
    const svc = document.querySelector(".svc");
    const list = svc && svc.querySelector(".svc-list");
    if (!svc || !list || svc.querySelector(".v3-hscroll")) return;

    const wrap = document.createElement("div");
    wrap.className = "v3-hscroll";
    wrap.innerHTML =
      '<p class="v3-hscroll-label">Drag the list →</p><div class="v3-hscroll__viewport"><div class="v3-hscroll__track"></div></div>';
    const track = wrap.querySelector(".v3-hscroll__track");
    list.querySelectorAll("li").forEach((li) => {
      const num = li.querySelector(".mono");
      const cond = li.querySelector(".cond");
      const card = document.createElement("article");
      card.className = "svc-card";
      card.innerHTML = `<span class="mono">${num ? num.textContent : ""}</span><span class="cond">${cond ? cond.textContent : ""}</span>`;
      track.appendChild(card);
    });
    list.style.display = "none";
    list.setAttribute("aria-hidden", "true");
    svc.querySelector(".wrap").appendChild(wrap);

    if (RM || window.innerWidth < 720) return;

    const cards = track.querySelectorAll(".svc-card");
    gsap.set(cards, { opacity: 0.35, scale: 0.94, rotate: -2 });
    gsap.to(cards, {
      opacity: 1,
      scale: 1,
      rotate: 0,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: wrap,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });

    const scrollWidth = () => track.scrollWidth - wrap.clientWidth + 48;
    gsap.to(track, {
      x: () => -scrollWidth(),
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top 18%",
        end: () => `+=${scrollWidth()}`,
        pin: wrap,
        scrub: 0.9,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  function sectionWipesAndShock() {
    if (RM) return;
    const flash = document.createElement("div");
    flash.className = "v3-shock-flash";
    flash.setAttribute("aria-hidden", "true");
    document.body.appendChild(flash);

    document.querySelectorAll("main .sec").forEach((sec, i) => {
      const wipe = document.createElement("div");
      wipe.className = "v3-section-wipe";
      sec.appendChild(wipe);
      ST.create({
        trigger: sec,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.fromTo(wipe, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.45, ease: "power4.inOut" });
          gsap.to(wipe, { opacity: 0, delay: 0.5, duration: 0.35 });
          if (i % 3 === 1) {
            gsap.fromTo(flash, { opacity: 0.22 }, { opacity: 0, duration: 0.35, ease: "power2.out" });
          }
        },
      });
    });
  }

  function revealBatch() {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;
    if (RM) {
      nodes.forEach((n) => n.classList.add("in"));
      return;
    }
    ST.batch(nodes, {
      start: "top 92%",
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          skewX: 0,
          stagger: 0.06,
          duration: 0.55,
          ease: "power3.out",
          overwrite: true,
        }),
      onLeaveBack: (batch) =>
        gsap.set(batch, { opacity: 0, y: 32, skewX: -4 }),
    });
    gsap.set(nodes, { opacity: 0, y: 32, skewX: -4 });
  }

  function growShape2() {
    const g = document.getElementById("grow2");
    if (!g) return;
    if (RM) {
      g.classList.add("on", "done");
      g.style.setProperty("--g2", "1");
      return;
    }
    ST.create({
      trigger: g.parentElement,
      start: "top 80%",
      end: "bottom 30%",
      scrub: 0.6,
      onUpdate: (self) => {
        const p = Math.max(0, Math.min(1, self.progress));
        g.style.setProperty("--g2", p.toFixed(3));
        if (p > 0.05 && !g.classList.contains("on")) {
          g.classList.add("on");
          const n = g.querySelectorAll("rect").length;
          setTimeout(() => g.classList.add("done"), n * 24 + 200);
        }
      },
    });
  }

  function finaleNavHide() {
    const f = document.querySelector(".studio-finale,[data-final-fullscreen]");
    if (!f) return;
    ST.create({
      trigger: f,
      start: "top 55%",
      onEnter: () => document.body.classList.add("nav-hide"),
      onLeaveBack: () => document.body.classList.remove("nav-hide"),
    });
  }

  function galleryCards() {
    const grid = document.getElementById("grid");
    if (!grid) return;
    if (RM) return;
    ST.batch(".card", {
      interval: 0.08,
      batchMax: 8,
      start: "top 95%",
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { opacity: 0, y: 48, rotateX: 12, skewY: 3 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            skewY: 0,
            stagger: 0.05,
            duration: 0.65,
            ease: "back.out(1.2)",
            clearProps: "transform",
          },
        );
      },
    });
    grid.addEventListener(
      "mousemove",
      (e) => {
        const card = e.target.closest(".card");
        if (!card || RM) return;
        const fr = card.querySelector(".fr");
        if (!fr) return;
        const r = fr.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(fr, {
          rotateY: px * 10,
          rotateX: -py * 8,
          duration: 0.35,
          ease: "power2.out",
        });
      },
      { passive: true },
    );
    grid.addEventListener("mouseleave", () => {
      grid.querySelectorAll(".fr").forEach((fr) => gsap.to(fr, { rotateX: 0, rotateY: 0, duration: 0.4 }));
    });
  }

  function impactStats() {
    document.querySelectorAll(".imp .v").forEach((el) => {
      if (RM) return;
      gsap.from(el, {
        scale: 0.6,
        skewX: -12,
        opacity: 0.2,
        scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
        duration: 0.8,
        ease: "power4.out",
      });
    });
  }

  function init() {
    spawnMotifs();
    marqueeBand();
    heroTypeMotion();
    servicesHorizontal();
    sectionWipesAndShock();
    revealBatch();
    growShape2();
    finaleNavHide();
    galleryCards();
    impactStats();
    ST.refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  addEventListener("load", () => ST.refresh());
  addEventListener(
    "resize",
    () => {
      clearTimeout(init._rz);
      init._rz = setTimeout(() => ST.refresh(), 150);
    },
    { passive: true },
  );
})();
