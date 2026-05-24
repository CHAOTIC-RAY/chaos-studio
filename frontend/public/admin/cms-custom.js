(function () {
  const WELCOME_ID = "chaos-cms-welcome";
  const MEDIA_BROWSER_ID = "chaos-media-browser";
  const MANIFEST_URL = "/admin/media-manifest.json";
  const SITE_ORIGIN = "https://portfolio.chaoticstudio.workers.dev";

  const CARDS = [
    {
      title: "Social posts",
      desc: "Campaign rail, tags, images & reels",
      hash: "#/collections/campaign/entries/campaign-posts",
    },
    {
      title: "Chaos Studio tab",
      desc: "Packages, pricing, services & studio contact",
      hash: "#/collections/chaos-studio/entries/studio-page",
    },
    {
      title: "Site content",
      desc: "Hero, experience, skills & contact",
      hash: "#/collections/portfolio/entries/main",
    },
    {
      title: "SEO & projects",
      desc: "Page title, work cards & covers",
      hash: "#/collections/site/entries/site-config",
    },
    {
      title: "All post images",
      desc: "Every image including carousel folders",
      hash: "#/media",
    },
  ];

  let manifestCache = null;

  function shouldShowWelcome() {
    const h = location.hash || "#/";
    return h === "#/" || h === "" || h === "#/collections";
  }

  function isMediaRoute() {
    return (location.hash || "").includes("/media");
  }

  function removeWelcome() {
    document.getElementById(WELCOME_ID)?.remove();
  }

  function removeMediaBrowser() {
    document.getElementById(MEDIA_BROWSER_ID)?.remove();
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
        <a href="https://portfolio.chaoticstudio.workers.dev/studio" target="_blank" rel="noopener">Chaos Studio tab</a>
        <a href="https://portfolio.chaoticstudio.workers.dev/#campaign" target="_blank" rel="noopener">Campaign section</a>
        <a href="https://github.com/CHAOTIC-RAY/portfolio/blob/main/content/CMS-SETUP.md" target="_blank" rel="noopener">Setup guide</a>
      </div>
    `;

    main.prepend(el);
  }

  async function loadManifest() {
    if (manifestCache) return manifestCache;
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load media manifest");
    manifestCache = await res.json();
    return manifestCache;
  }

  function renderMediaGrid(files, query, folder) {
    const q = query.trim().toLowerCase();
    const filtered = files.filter((f) => {
      if (folder && folder !== "all" && f.folder !== folder) return false;
      if (!q) return true;
      return f.path.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q);
    });

    if (!filtered.length) {
      return `<p class="chaos-media-empty">No images match your search.</p>`;
    }

    return `<div class="chaos-media-grid">${filtered
      .map((f) => {
        const thumb = `${SITE_ORIGIN}${f.url}`;
        const copyValue = f.slideBasename || f.name.replace(/\.[^.]+$/, "");
        return `
        <button type="button" class="chaos-media-item" data-copy="${copyValue.replace(/"/g, "&quot;")}" title="Click to copy slide/image name for CMS">
          <img src="${thumb}" alt="" loading="lazy" width="160" height="160" />
          <span class="chaos-media-item__folder">${f.folder}</span>
          <span class="chaos-media-item__name">${f.name}</span>
        </button>`;
      })
      .join("")}</div>`;
  }

  async function injectMediaBrowser() {
    if (!isMediaRoute()) {
      removeMediaBrowser();
      return;
    }
    if (document.getElementById(MEDIA_BROWSER_ID)) return;

    const host =
      document.querySelector('[class*="AppMainContainer"]') ||
      document.querySelector('[class*="Main"]') ||
      document.querySelector("main");
    if (!host) return;

    const panel = document.createElement("section");
    panel.id = MEDIA_BROWSER_ID;
    panel.className = "chaos-media-browser";
    panel.innerHTML = `
      <div class="chaos-media-browser__head">
        <div>
          <h2>All post images</h2>
          <p class="chaos-media-browser__lead">The built-in Media grid only shows <strong>root</strong> uploads. Carousel images live in <strong>folders</strong> (one folder per post ID). Browse everything here.</p>
        </div>
        <p class="chaos-media-browser__stats" data-media-stats>Loading…</p>
      </div>
      <div class="chaos-media-browser__tools">
        <input type="search" class="chaos-media-search" placeholder="Search by post name or file…" aria-label="Search images" />
        <select class="chaos-media-folder" aria-label="Filter by folder">
          <option value="all">All folders</option>
        </select>
      </div>
      <p class="chaos-media-hint">Tip: click an image to copy the <strong>slide name</strong> for CMS (e.g. <code>slide-02</code>). Post ID must match the folder name above.</p>
      <div data-media-grid><p class="chaos-media-empty">Loading images…</p></div>
    `;

    host.prepend(panel);

    const search = panel.querySelector(".chaos-media-search");
    const folderSelect = panel.querySelector(".chaos-media-folder");
    const gridHost = panel.querySelector("[data-media-grid]");
    const stats = panel.querySelector("[data-media-stats]");

    try {
      const data = await loadManifest();
      stats.textContent = `${data.total} files · ${data.rootCount} in root · ${data.total - data.rootCount} in folders`;

      for (const folder of data.folders) {
        const opt = document.createElement("option");
        opt.value = folder;
        opt.textContent = folder;
        folderSelect.appendChild(opt);
      }

      const paint = () => {
        gridHost.innerHTML = renderMediaGrid(data.files, search.value, folderSelect.value);
        gridHost.querySelectorAll(".chaos-media-item").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const text = btn.getAttribute("data-copy") || "";
            try {
              await navigator.clipboard.writeText(text);
              btn.classList.add("chaos-media-item--copied");
              setTimeout(() => btn.classList.remove("chaos-media-item--copied"), 1200);
            } catch {
              window.prompt("Copy this path into the CMS field:", text);
            }
          });
        });
      };

      search.addEventListener("input", paint);
      folderSelect.addEventListener("change", paint);
      paint();
    } catch {
      stats.textContent = "Could not load image list";
      gridHost.innerHTML =
        '<p class="chaos-media-empty">Image list failed to load. Redeploy the site or run <code>npm run media:manifest</code> locally.</p>';
    }
  }

  function boot() {
    injectWelcome();
    injectMediaBrowser();
    window.addEventListener("hashchange", () => {
      injectWelcome();
      injectMediaBrowser();
    });
    const obs = new MutationObserver(() => {
      injectWelcome();
      injectMediaBrowser();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
