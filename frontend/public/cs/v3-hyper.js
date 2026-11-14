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
    if (RM || coarse || !window.Lenis || document.body.classList.contains("route-studio")) return null;
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: false,
      syncTouch: false,
      touchMultiplier: 1.15,
    });
    lenis.on("scroll", ST.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    let resizeT;
    addEventListener(
      "resize",
      () => {
        clearTimeout(resizeT);
        resizeT = setTimeout(() => lenis.resize(), 150);
      },
      { passive: true },
    );
    return lenis;
  }

  const lenis = lenisSetup();
  let marqueeTweenRef = null;

  function csWordmark(extra = "") {
    return `<span class="wordmark-pair"><span class="wordmark-chaos">CHAOS</span> <span class="wordmark-studio wordmark-studio--solid">STUDIO</span>${extra}</span>`;
  }

  function studioServiceNames() {
    const fromList = [...document.querySelectorAll(".svc-list .cond")].map((el) => el.textContent.trim()).filter(Boolean);
    if (fromList.length) return fromList;
    if (window.ChaosStudioServices) return window.ChaosStudioServices();
    return [];
  }

  function marqueeServiceChunk() {
    const names = studioServiceNames();
    if (!names.length) return `<span class="v3-marquee__item v3-marquee__item--paper">CHAOS STUDIO</span>`;
    return names
      .map((name, i) => {
        const tone = i % 2 === 0 ? "v3-marquee__item--paper" : "v3-marquee__item--lilac";
        return `<span class="v3-marquee__item ${tone}">${name}</span><span class="v3-marquee__sep shock" aria-hidden="true">✶</span>`;
      })
      .join("");
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

  const MARQUEE_SPEED = 0.4;

  function fillMarqueeTrack(track) {
    const chunk = marqueeServiceChunk();
    track.innerHTML = chunk.repeat(coarse ? 8 : 10);
  }

  function marqueeBand(forceRefresh) {
    let band = document.querySelector(".v3-marquee");
    if (!band) {
      const svc = document.querySelector(".svc");
      if (!svc) return;
      band = document.createElement("div");
      band.className = "v3-marquee";
      band.setAttribute("aria-hidden", "true");
      band.innerHTML = `<div class="v3-marquee__track" data-marquee>${marqueeServiceChunk()}</div>`;
      svc.parentElement.insertBefore(band, svc);
    }
    const track = band.querySelector("[data-marquee]");
    if (!track) return;
    if (track.dataset.ready && !forceRefresh) return;
    track.dataset.ready = "1";
    fillMarqueeTrack(track);
    if (RM) {
      track.style.transform = "translateX(-8%)";
      return;
    }
    if (marqueeTweenRef) {
      marqueeTweenRef.kill();
      marqueeTweenRef = null;
    }
    const baseDuration = coarse ? 42 : 36;
    const marqueeTween = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: baseDuration / MARQUEE_SPEED,
      repeat: -1,
      paused: true,
    });
    marqueeTweenRef = marqueeTween;
    if (!band.dataset.marqueeHooks) {
      band.dataset.marqueeHooks = "1";
      band.addEventListener("mouseenter", () => marqueeTween.pause());
      band.addEventListener("mouseleave", () => {
        if (band.dataset.marqueeVisible === "1") marqueeTween.play();
      });
      ST.create({
        trigger: band,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => {
          band.dataset.marqueeVisible = "1";
          if (!band.matches(":hover")) marqueeTween.play();
        },
        onLeave: () => {
          band.dataset.marqueeVisible = "0";
          marqueeTween.pause();
        },
        onEnterBack: () => {
          band.dataset.marqueeVisible = "1";
          if (!band.matches(":hover")) marqueeTween.play();
        },
        onLeaveBack: () => {
          band.dataset.marqueeVisible = "0";
          marqueeTween.pause();
        },
        onUpdate: (self) => {
          const v = self.getVelocity() / 800;
          marqueeTween.timeScale(
            (1 + Math.min(1.2, Math.abs(v)) * (v < 0 ? -1 : 1)) * MARQUEE_SPEED,
          );
        },
      });
    }
  }

  function heroTypeMotion() {
    const hero = document.querySelector(".hero-h");
    if (!hero || RM) return;
    hero.querySelectorAll(".glitch, .hero-studio").forEach((node) => {
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

  const ABOUT_MARKS = ["/assets/motifs/marks/chaos-mark-a.svg", "/assets/motifs/marks/chaos-mark-c.svg"];

  let aboutBgReady = false;
  let aboutEnterDone = false;

  function aboutBgMarquee() {
    const about = document.querySelector(".about");
    if (!about) return;
    about.querySelectorAll(".pattern-matter, .about-veil, .about-shards, .pattern.rgb").forEach((el) => el.remove());
    about.classList.remove("cine-shot", "cine-shot--reveal", "cine-shot__letterbox", "is-exploding", "is-framed");

    let bg = about.querySelector(".about-bg");
    if (!bg) {
      bg = document.createElement("div");
      bg.className = "about-bg";
      bg.setAttribute("aria-hidden", "true");
      about.insertBefore(bg, about.firstChild);
    }
    if (aboutBgReady) return;
    aboutBgReady = true;

    const chunk = () => {
      const marks = ABOUT_MARKS.map(
        (src) => `<span class="about-bg-motif"><img src="${src}" alt="" width="48" height="48" decoding="async"></span>`,
      ).join("");
      return `<span class="about-bg-word">CHAOS</span><span class="about-bg-word about-bg-word--studio">STUDIO</span>${marks}<span class="about-bg-word">CHAOS</span><span class="about-bg-word about-bg-word--studio">STUDIO</span>${marks}`;
    };
    const rowCount = narrow ? 3 : 5;
    const rows = [];
    for (let i = 0; i < rowCount; i++) {
      const dir = i % 2 ? "rtl" : "ltr";
      rows.push(
        `<div class="about-bg-row about-bg-row--${dir}"><div class="about-bg-track">${chunk()}${chunk()}</div></div>`,
      );
    }
    bg.innerHTML = `<div class="about-bg-marquee">${rows.join("")}</div>`;

    const tracks = bg.querySelectorAll(".about-bg-track");
    const setPaused = (paused) => tracks.forEach((t) => t.classList.toggle("is-paused", paused));
    if (RM) {
      setPaused(true);
      return;
    }
    ST.create({
      trigger: about,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => setPaused(false),
      onLeave: () => setPaused(true),
      onEnterBack: () => setPaused(false),
      onLeaveBack: () => setPaused(true),
    });
    setPaused(false);

    if (!coarse) {
      gsap.to(bg, {
        y: narrow ? 24 : 48,
        ease: "none",
        scrollTrigger: { trigger: about, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    }
  }

  function aboutSectionEnter() {
    const about = document.querySelector(".about");
    if (!about || aboutEnterDone) return;
    aboutEnterDone = true;

    const title = about.querySelector(".about-h");
    const hl = about.querySelector(".about-hl");
    const panel = about.querySelector(".about-panel");
    const cards = [...about.querySelectorAll(".about-list li")];
    const tilts = [-6, 5, -4, 6];

    if (RM) {
      title?.classList.add("about-in");
      panel?.classList.add("about-in");
      cards.forEach((c) => c.classList.add("about-in"));
      return;
    }

    if (title) {
      gsap.from(title, {
        y: 52,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: { trigger: title, start: "top 88%", once: true },
      });
    }
    if (hl) {
      gsap.fromTo(
        hl,
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          duration: 0.55,
          ease: "power3.out",
          delay: 0.12,
          scrollTrigger: { trigger: title || about, start: "top 88%", once: true },
        },
      );
    }
    if (panel) {
      gsap.from(panel, {
        y: 36,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.08,
        scrollTrigger: { trigger: panel, start: "top 90%", once: true },
      });
    }
    if (cards.length) {
      gsap.set(cards, { transformOrigin: "50% 80%" });
      gsap.from(cards, {
        y: 48,
        opacity: 0,
        rotation: (i) => tilts[i % tilts.length] || 0,
        stagger: 0.09,
        duration: 0.52,
        ease: "back.out(1.35)",
        scrollTrigger: { trigger: about.querySelector(".about-list") || about, start: "top 91%", once: true },
        onComplete: () => {
          cards.forEach((c) => {
            const tilt = c.style.getPropertyValue("--tilt").trim() || "0deg";
            const deg = parseFloat(tilt) || 0;
            gsap.set(c, { rotation: deg, y: 0, opacity: 1, clearProps: "transform" });
            c.style.transform = `rotate(${tilt})`;
          });
        },
      });
    }
  }

  const CINE_SHOTS = [
    { sel: ".hero", type: "establishing", letterbox: false },
    { sel: ".about", type: "reveal", letterbox: true, skip: true },
    { sel: ".showcase-strip", type: "closeup", letterbox: false },
    { sel: ".svc", type: "establishing", letterbox: false },
    { sel: ".whys", type: "closeup", letterbox: false },
    { sel: ".pks-sec", type: "reveal", letterbox: true },
    { sel: ".imp", type: "closeup", letterbox: false },
    { sel: ".kw", type: "titlecard", letterbox: true },
    { sel: ".studio-finale", type: "establishing", letterbox: false },
  ];

  function cineHeroEstablishing() {
    const hero = document.querySelector(".hero");
    if (!hero || RM) return;
    hero.classList.add("cine-shot", "cine-shot--establishing");
    const wrap = hero.querySelector(".wrap");
    if (!wrap) return;
    wrap.classList.add("cine-title");
    gsap.fromTo(
      wrap,
      { scale: narrow ? 1.04 : 1.07, y: 0, transformOrigin: "50% 18%" },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      },
    );
    const label = hero.querySelector(".rot-label");
    if (label) {
      label.classList.add("cine-depth");
      gsap.to(label, {
        y: narrow ? 36 : 72,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.85 },
      });
    }
  }

  function cineParallaxLayers() {
    if (RM) return;
    document.querySelectorAll("main .sec").forEach((sec) => {
      const label = sec.querySelector(".rot-label");
      const frame = sec.querySelector(".frame");
      const lime = sec.querySelector(".lime-strip");
      [
        [label, narrow ? 14 : 28],
        [frame, narrow ? 8 : 16],
        [lime, narrow ? -10 : -18],
      ].forEach(([el, drift]) => {
        if (!el) return;
        el.classList.add("cine-depth");
        gsap.to(el, {
          y: drift,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: sec,
            start: "top bottom",
            end: "bottom top",
            scrub: coarse ? 1.2 : 0.65,
          },
        });
      });
    });
  }

  function cineMatchCuts() {
    if (RM) return;
    const secs = [...document.querySelectorAll("main .sec")];
    secs.forEach((sec, i) => {
      if (i === 0) return;
      const prev = secs[i - 1];
      const prevWrap = prev.querySelector(".wrap") || prev;
      const wrap = sec.querySelector(".wrap") || sec;
      let cut = sec.querySelector(".cine-match-wipe");
      if (!cut) {
        cut = document.createElement("div");
        cut.className = "cine-match-wipe";
        cut.setAttribute("aria-hidden", "true");
        sec.prepend(cut);
      }
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top 98%",
          end: "top 58%",
          scrub: 0.55,
        },
      });
      tl.fromTo(prevWrap, { scale: 1, opacity: 1, force3D: true }, { scale: 0.982, opacity: narrow ? 0.9 : 0.82 }, 0).fromTo(
        wrap,
        { scale: 1.035, y: narrow ? 16 : 28, opacity: narrow ? 0.88 : 0.75, force3D: true },
        { scale: 1, y: 0, opacity: 1, duration: 1 },
        0,
      );
      if (cut) {
        tl.fromTo(cut, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 1, duration: 0.25, ease: "power4.in" }, 0.05).to(
          cut,
          { opacity: 0, duration: 0.35 },
          0.55,
        );
      }
    });
  }

  function cineFocusPull(sec, focusEl) {
    if (RM || !focusEl) return;
    if (narrow) {
      ST.create({
        trigger: sec,
        start: "top 78%",
        end: "top 42%",
        scrub: 0.45,
        onUpdate: (self) => {
          focusEl.style.opacity = `${0.55 + self.progress * 0.45}`;
        },
        onLeave: () => {
          focusEl.style.opacity = "";
        },
        onLeaveBack: () => {
          focusEl.style.opacity = "";
        },
      });
      return;
    }
    focusEl.classList.add("cine-focus-target");
    ST.create({
      trigger: sec,
      start: "top 76%",
      end: "top 38%",
      scrub: 0.4,
      onUpdate: (self) => {
        focusEl.classList.toggle("cine-focus-out", self.progress < 0.92);
      },
    });
  }

  function cineLetterboxPulse(sec) {
    if (RM || !sec.classList.contains("cine-shot__letterbox")) return;
    ST.create({
      trigger: sec,
      start: "top 62%",
      end: "bottom 38%",
      onEnter: () => sec.classList.add("is-framed"),
      onLeave: () => sec.classList.remove("is-framed"),
      onEnterBack: () => sec.classList.add("is-framed"),
      onLeaveBack: () => sec.classList.remove("is-framed"),
    });
  }

  function cinemaDirecting() {
    if (RM) return;
    CINE_SHOTS.forEach((cfg) => {
      const sec = document.querySelector(cfg.sel);
      if (!sec || cfg.skip) return;
      sec.classList.add("cine-shot", `cine-shot--${cfg.type}`);
      if (cfg.letterbox) sec.classList.add("cine-shot__letterbox");
      const inner = sec.querySelector(".wrap") || sec.querySelector(".studio-finale__inner") || sec;
      inner.classList.add("cine-title");
      gsap.set(inner, { opacity: 1, y: 0, scale: 1, filter: "none" });
      if (coarse || narrow) {
        cineLetterboxPulse(sec);
        return;
      }
      const enter = { y: narrow ? 22 : 40, opacity: 0, scale: 0.98, force3D: true };
      let enterScale = 1;
      if (cfg.type === "establishing") enter.scale = narrow ? 1.03 : 1.05;
      if (cfg.type === "closeup") {
        enter.scale = narrow ? 0.96 : 0.94;
        enterScale = 1.01;
      }
      if (cfg.type === "titlecard") {
        enter.y = narrow ? 32 : 52;
        enter.scale = 0.99;
      }
      const from = { ...enter };
      if (!narrow && cfg.type !== "titlecard") from.filter = "blur(4px)";
      gsap.fromTo(
        inner,
        from,
        {
          y: 0,
          opacity: 1,
          scale: enterScale,
          filter: narrow ? undefined : "blur(0px)",
          ease: "power2.out",
          duration: narrow ? 0.5 : 0.72,
          immediateRender: false,
          scrollTrigger: {
            trigger: sec,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        },
      );
      cineLetterboxPulse(sec);
      const bg = sec.querySelector(".pattern-matter, .studio-finale__wash, .lime-strip");
      if (bg) cineFocusPull(sec, bg);
    });
    cineHeroEstablishing();
    cineParallaxLayers();
    cineMatchCuts();
  }

  function scrollTextMotion() {
    if (RM) return;
    document.querySelectorAll(".about-h, .work-h, .svc-title, .pk-head h2, .imp-h, .t-h").forEach((el) => {
      if (coarse || narrow) return;
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
    gsap.set(tiles, { opacity: 1, y: 0 });
    if (coarse || narrow) return;
    ST.batch(tiles, {
      start: "top 94%",
      onEnter: (batch) =>
        gsap.fromTo(batch, { y: 16 }, { y: 0, stagger: 0.04, duration: 0.35, ease: "power2.out", overwrite: true }),
    });
  }

  function featuredBentoMotion() {
    const feats = document.querySelectorAll(".featured-bento .feat:not(.in)");
    if (!feats.length || RM) return;
    ST.batch(feats, {
      start: "top 93%",
      onEnter: (batch) =>
        gsap.fromTo(
          batch,
          { y: 28, scale: 0.98 },
          { y: 0, scale: 1, stagger: 0.06, duration: 0.48, ease: "power3.out", overwrite: true },
        ),
    });
  }

  function pricingBentoMotion() {
    const pk = [...document.querySelectorAll(".pk-bento .pk")].filter((el) => !el.dataset.pkMotion);
    if (!pk.length || RM) return;
    pk.forEach((el) => {
      el.dataset.pkMotion = "1";
    });
    ST.batch(pk, {
      start: "top 93%",
      onEnter: (batch) =>
        gsap.from(batch, {
          scale: 0.98,
          y: 16,
          stagger: 0.07,
          duration: 0.45,
          ease: "power2.out",
          immediateRender: false,
        }),
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

  let revealMotionDone = false;

  function revealBatch() {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;
    nodes.forEach((n) => n.classList.add("in"));
    if (RM || revealMotionDone) return;
    revealMotionDone = true;
    ST.batch(nodes, {
      start: "top 92%",
      onEnter: (batch) =>
        gsap.from(batch, {
          y: 28,
          skewX: -3,
          stagger: 0.06,
          duration: 0.55,
          ease: "power3.out",
          overwrite: true,
          immediateRender: false,
        }),
    });
  }

  function whySectionMotion() {
    const sec = document.querySelector(".whys");
    if (!sec) return;
    const title = sec.querySelector(".why-title__inner");
    const brace = sec.querySelector(".why-brace__inner");
    const motif = sec.querySelector(".why-motif img");
    const cards = [...sec.querySelectorAll("[data-why-card]")];

    if (RM) {
      [title, brace, ...cards].forEach((el) => el && el.classList.add("why-in"));
      return;
    }

    const wrapTitle = sec.querySelector(".why-title");
    if (wrapTitle && title) {
      gsap.set(wrapTitle, { overflow: "hidden" });
      gsap.fromTo(title, { yPercent: 108, skewY: 6 }, {
        yPercent: 0,
        skewY: 0,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: { trigger: wrapTitle, start: "top 88%", once: true },
      });
    }

    if (brace) {
      gsap.set(brace.parentElement, { overflow: "hidden" });
      gsap.fromTo(
        brace,
        { xPercent: -108, opacity: 0.72 },
        {
          xPercent: 0,
          opacity: 1,
          duration: 0.65,
          ease: "power3.out",
          scrollTrigger: { trigger: brace, start: "top 90%", once: true },
          onComplete: () => {
            gsap.set(brace, { opacity: 1 });
          },
        },
      );
    }

    if (motif) {
      gsap.fromTo(
        motif,
        { scale: coarse ? 0.88 : 0.82, rotate: -18, opacity: 0.12 },
        {
          scale: 1,
          rotate: 0,
          opacity: 0.22,
          ease: "none",
          scrollTrigger: { trigger: sec, start: "top 92%", end: "bottom 40%", scrub: coarse ? 1.1 : 0.85 },
        },
      );
    }

    cards.forEach((card, i) => {
      const rule = card.querySelector(".why-rule");
      const num = card.querySelector(".num");
      const h3 = card.querySelector("h3");
      const body = card.querySelector("p");
      const st = { trigger: card, start: "top 92%", once: true };

      if (rule) {
        gsap.fromTo(rule, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.55, ease: "power2.out", scrollTrigger: st });
      }
      if (num) {
        gsap.set(num, { opacity: 1, scale: 1, y: 0 });
        if (!coarse && !narrow) {
          gsap.fromTo(
            num,
            { scale: 0.88, y: 10 },
            {
              scale: 1,
              y: 0,
              duration: 0.45,
              delay: 0.04,
              ease: "back.out(1.35)",
              scrollTrigger: st,
            },
          );
        }
      }
      if (h3 || body) {
        gsap.fromTo([h3, body].filter(Boolean), { y: coarse ? 16 : 22, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          delay: 0.12 + i * 0.04,
          ease: "power3.out",
          scrollTrigger: st,
        });
      }
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
        scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
        duration: 0.8,
        ease: "power4.out",
      });
    });
  }

  function init() {
    spawnMotifs();
    marqueeBand();
    heroTypeMotion();
    aboutBgMarquee();
    aboutSectionEnter();
    cinemaDirecting();
    scrollTextMotion();
    servicesBentoMotion();
    featuredBentoMotion();
    pricingBentoMotion();
    sectionWipesAndShock();
    revealBatch();
    whySectionMotion();
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

  document.addEventListener("cms-content-ready", () => {
    marqueeBand(true);
    pricingBentoMotion();
    ST.refresh();
  });

  document.addEventListener("cs-packages-ready", () => {
    pricingBentoMotion();
    window.ChaosDotNumerals && window.ChaosDotNumerals.boot();
    if (window.ChaosStudioPackages && window.ChaosStudioPackages.wireToggles) {
      window.ChaosStudioPackages.wireToggles();
    }
    ST.refresh();
  });

  document.addEventListener("cs-showcase-ready", () => {
    featuredBentoMotion();
    ST.refresh();
  });

  addEventListener("load", () => {
    window.ChaosDotMatrixText && window.ChaosDotMatrixText.boot();
    featuredBentoMotion();
    ST.refresh();
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
