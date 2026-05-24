(function () {
  const WELCOME_ID = "chaos-cms-welcome";
  const CARDS = [
    {
      title: "Social posts",
      desc: "Campaign rail, tags, images & reels",
      hash: "#/collections/campaign/entries/campaign-posts",
    },
    {
      title: "Site content",
      desc: "Hero, experience, Chaos Studio, contact",
      hash: "#/collections/portfolio/entries/main",
    },
    {
      title: "SEO & projects",
      desc: "Page title, work cards & covers",
      hash: "#/collections/site/entries/site-config",
    },
    {
      title: "Media library",
      desc: "Upload post images",
      hash: "#/media",
    },
  ];

  function shouldShowWelcome() {
    const h = location.hash || "#/";
    return h === "#/" || h === "" || h === "#/collections";
  }

  function removeWelcome() {
    document.getElementById(WELCOME_ID)?.remove();
  }

  function injectWelcome() {
    if (!shouldShowWelcome()) {
      removeWelcome();
      return;
    }
    if (document.getElementById(WELCOME_ID)) return;

    const main =
      document.querySelector('[class*="CollectionMain"]') ||
      document.querySelector('[class*="Main"]') ||
      document.querySelector("main");

    if (!main) return;

    const el = document.createElement("section");
    el.id = WELCOME_ID;
    el.className = "chaos-cms-welcome";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "CMS quick start");

    const cardsHtml = CARDS.map(
      (c) =>
        `<a class="chaos-cms-card" href="${c.hash}"><strong>${c.title}</strong><span>${c.desc}</span></a>`,
    ).join("");

    el.innerHTML = `
      <h1>Chaos Studio CMS</h1>
      <p>Edit portfolio copy and social posts here. Pick a section below — changes publish to GitHub and deploy automatically.</p>
      <div class="chaos-cms-cards">${cardsHtml}</div>
      <div class="chaos-cms-links">
        <a href="https://portfolio.chaoticstudio.workers.dev/" target="_blank" rel="noopener">View live site</a>
        <a href="https://portfolio.chaoticstudio.workers.dev/#campaign" target="_blank" rel="noopener">Campaign section</a>
        <a href="https://github.com/CHAOTIC-RAY/portfolio/blob/main/content/CMS-SETUP.md" target="_blank" rel="noopener">Setup guide</a>
      </div>
    `;

    main.prepend(el);
  }

  function boot() {
    injectWelcome();
    window.addEventListener("hashchange", injectWelcome);
    const obs = new MutationObserver(() => injectWelcome());
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
