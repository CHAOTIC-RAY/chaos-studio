/* Chaos Studio V3 — Lenis + GSAP ScrollTrigger (transform/opacity only). */
(function () {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
  const narrow = matchMedia("(max-width: 520px)").matches;
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

  function csWordmark(extra = "") {
    return `<span class="wordmark-pair"><span class="wordmark-chaos">CHAOS</span> <span class="wordmark-studio" data-dot-text="STUDIO" data-dot-size="${narrow ? "11" : "14"}" data-dot-font="Anton, sans-serif">STUDIO</span>${extra}</span>`;
  }

  function spawnMotifs() {
    const layer = document.createElement("div");
    layer.className = "v3-motif-layer";
    layer.setAttribute("aria-hidden", "true");
    const pool = [...MARKS, ...SHAPES, ...DOTS];
    const n = RM ? 0 : coarse ? 4 : 14;
    if (n === 0) return;
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
      band.innerHTML = `<div class="v3-marquee__track" data-marquee>${csWordmark(' <span class="shock">✱</span> ')}</div>`;
      svc.parentElement.insertBefore(band, svc);
    }
    const track = band.querySelector("[data-marquee]");
    if (!track || track.dataset.ready) return;
    track.dataset.ready = "1";
    const chunk = track.innerHTML;
    track.innerHTML = chunk.repeat(12);
    window.ChaosDotMatrixText && window.ChaosDotMatrixText.boot();
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
    hero.querySelectorAll(".glitch, .st, .dot-display").forEach((node) => {
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

  function aboutPatternMatter() {
    const about = document.querySelector(".about");
    const legacy = about && about.querySelector(".pattern.rgb");
    if (!about) return;
    let matter = about.querySelector(".pattern-matter");
    if (!matter) {
      matter = document.createElement("div");
      matter.className = "pattern-matter";
      matter.setAttribute("aria-hidden", "true");
      about.insertBefore(matter, about.firstChild);
    }
    if (legacy) legacy.remove();
    const piece = csWordmark(" ✶ ");
    const rowText = piece.repeat(14);
    matter.innerHTML = "";
    const rowCount = narrow ? 4 : 6;
    for (let i = 0; i < rowCount; i++) {
      const row = document.createElement("div");
      row.className = `pattern-row pattern-row--${i % 2 ? "rev" : "fwd"}`;
      row.innerHTML = `<div class="pattern-track"><span>${rowText}</span></div>`;
      matter.appendChild(row);
    }
    if (RM) return;
    const rows = matter.querySelectorAll(".pattern-track");
    rows.forEach((track, i) => {
      const dir = i % 2 ? 1 : -1;
      gsap.to(track, {
        xPercent: dir * 12,
        ease: "none",
        duration: 22 + i * 2,
        repeat: -1,
      });
    });
    if (!narrow && !RM) {
      let skewRaf = 0;
      ST.create({
        trigger: about,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          if (skewRaf) return;
          skewRaf = requestAnimationFrame(() => {
            skewRaf = 0;
            const skew = Math.max(-3, Math.min(3, self.getVelocity() / 400));
            matter.style.transform = `translate3d(0,0,0) skewX(${skew}deg)`;
          });
        },
      });
    }
    window.ChaosDotMatrixText && window.ChaosDotMatrixText.boot();
  }

  function aboutChaosReveal() {
    const about = document.querySelector(".about");
    if (!about) return;
    about.classList.add("cine-shot", "cine-shot__letterbox");

    let veil = about.querySelector(".about-veil");
    let shards = about.querySelector(".about-shards");
    if (!veil) {
      veil = document.createElement("div");
      veil.className = "about-veil";
      veil.setAttribute("aria-hidden", "true");
      about.appendChild(veil);
    }
    if (!shards) {
      shards = document.createElement("div");
      shards.className = "about-shards";
      shards.setAttribute("aria-hidden", "true");
      shards.innerHTML = "<i></i><i></i><i></i>";
      about.appendChild(shards);
    }

    if (RM) {
      gsap.set(veil, { opacity: 0, pointerEvents: "none" });
      return;
    }

    const shardEls = shards.querySelectorAll("i");
    const shardMotion = [
      { x: -80, y: -40, r: -12 },
      { x: 90, y: -28, r: 18 },
      { x: -40, y: 72, r: 8 },
    ];
    shardEls.forEach((el, i) => {
      gsap.set(el, { opacity: 0, scale: 0.92, x: 0, y: 0, rotate: 0, force3D: true });
      if (shardMotion[i]) gsap.set(el, { transformOrigin: "50% 50%" });
    });

    gsap.set(veil, {
      opacity: 1,
      scale: 1,
      transformOrigin: "50% 38%",
      force3D: true,
      webkitClipPath: "inset(0% 0% 0% 0%)",
      clipPath: "inset(0% 0% 0% 0%)",
    });

    const endLen = narrow ? innerHeight * 0.85 : innerHeight * 1.05;
    const stOpts = {
      trigger: about,
      start: narrow ? "top 88%" : "top top",
      end: `+=${endLen}`,
      scrub: narrow ? 0.65 : 0.85,
      invalidateOnRefresh: true,
      onEnter: () => about.classList.add("is-framed"),
      onLeave: () => about.classList.remove("is-framed"),
      onEnterBack: () => about.classList.add("is-framed"),
      onLeaveBack: () => about.classList.remove("is-framed"),
    };
    if (!narrow) {
      stOpts.pin = true;
      stOpts.anticipatePin = 1;
      stOpts.pinSpacing = true;
    }

    const tl = gsap.timeline({ scrollTrigger: stOpts });

    tl.to(
      veil,
      {
        scale: narrow ? 1.55 : 1.75,
        opacity: 0,
        duration: 1,
        ease: "power2.in",
        webkitClipPath: "inset(0% 0% 100% 0%)",
        clipPath: "inset(0% 0% 100% 0%)",
      },
      0,
    );

    shardEls.forEach((el, i) => {
      const m = shardMotion[i] || shardMotion[0];
      tl.to(
        el,
        {
          opacity: 0.7,
          x: m.x,
          y: m.y,
          rotate: m.r,
          scale: 1.05,
          duration: 0.35,
          ease: "power2.out",
        },
        0.12 + i * 0.04,
      ).to(el, { opacity: 0, duration: 0.25 }, 0.55);
    });
  }

  function cinemaDirecting() {
    if (RM) return;
    const shots = document.querySelectorAll("main .sec:not(.hero)");
    shots.forEach((sec, i) => {
      sec.classList.add("cine-shot");
      const inner = sec.querySelector(".wrap") || sec;
      inner.classList.add("cine-title");
      const blurFrom = narrow ? undefined : "blur(5px)";
      gsap.fromTo(
        inner,
        { y: narrow ? 28 : 44, opacity: 0, scale: 0.985, filter: blurFrom },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: narrow ? undefined : "blur(0px)",
          ease: "power2.out",
          scrollTrigger: {
            trigger: sec,
            start: "top 86%",
            toggleActions: "play none none reverse",
          },
          duration: narrow ? 0.55 : 0.75,
        },
      );
      if (i > 0) {
        gsap.fromTo(
          sec,
          { opacity: 0.94 },
          {
            opacity: 1,
            scrollTrigger: { trigger: sec, start: "top 92%", end: "top 55%", scrub: 0.5 },
          },
        );
      }
    });
  }

  function scrollTextMotion() {
    if (RM) return;
    document.querySelectorAll(".about-h, .work-h, .svc-title, .pk-head h2, .imp-h, .t-h").forEach((el) => {
      el.querySelectorAll(".hl").forEach((hl) => hl.classList.add("v3-hl-wipe"));
      const rich = el.querySelector(".glitch, .dot-display, .hl");
      if (rich) {
        gsap.fromTo(
          el,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
          },
        );
      } else {
        const words = el.textContent.trim().split(/\s+/);
        el.innerHTML = words.map((w) => `<span class="v3-split-word"><i>${w}</i></span> `).join("");
        el.querySelectorAll(".v3-split-word i").forEach((w, i) => {
          gsap.fromTo(
            w,
            { yPercent: 120, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
              delay: i * 0.04,
              duration: 0.55,
            },
          );
        });
      }
    });
    gsap.utils.toArray(".v3-hl-wipe").forEach((hl) => {
      gsap.fromTo(
        hl,
        { "--hlx": 0 },
        {
          "--hlx": 1,
          ease: "power2.out",
          duration: 0.5,
          scrollTrigger: { trigger: hl, start: "top 90%", toggleActions: "play none none reverse" },
        },
      );
    });
  }

  function servicesBentoMotion() {
    const tiles = document.querySelectorAll(".svc-tile");
    if (!tiles.length || RM) return;
    ST.batch(tiles, {
      start: "top 92%",
      onEnter: (batch) =>
        gsap.fromTo(batch, { opacity: 0, y: 28 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.45, ease: "power2.out" }),
    });
    gsap.set(tiles, { opacity: 0, y: 28 });
  }

  function featuredBentoMotion() {
    const feats = document.querySelectorAll(".featured-bento .feat");
    if (!feats.length || RM) return;
    ST.batch(feats, {
      start: "top 93%",
      onEnter: (batch) =>
        gsap.fromTo(batch, { opacity: 0, y: 32 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" }),
    });
  }

  function pricingBentoMotion() {
    const pk = document.querySelectorAll(".pk-bento .pk");
    if (!pk.length || RM) return;
    ST.batch(pk, {
      start: "top 93%",
      onEnter: (batch) =>
        gsap.fromTo(batch, { opacity: 0, scale: 0.97, y: 20 }, { opacity: 1, scale: 1, y: 0, stagger: 0.07, duration: 0.45 }),
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
    aboutPatternMatter();
    aboutChaosReveal();
    cinemaDirecting();
    scrollTextMotion();
    servicesBentoMotion();
    featuredBentoMotion();
    pricingBentoMotion();
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

  document.addEventListener("cs-showcase-ready", () => {
    featuredBentoMotion();
    ST.refresh();
  });

  addEventListener("load", () => {
    window.ChaosDotMatrixText && window.ChaosDotMatrixText.boot();
    featuredBentoMotion();
    ST.refresh(true);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      window.ChaosDotMatrixText && window.ChaosDotMatrixText.boot();
      ST.refresh();
    });
  }
  addEventListener(
    "resize",
    () => {
      clearTimeout(init._rz);
      init._rz = setTimeout(() => ST.refresh(), 150);
    },
    { passive: true },
  );
})();
