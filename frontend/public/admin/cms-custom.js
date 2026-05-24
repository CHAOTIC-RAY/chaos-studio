(function () {
  const WELCOME_ID = "chaos-cms-welcome";
  const MEDIA_BROWSER_ID = "chaos-media-browser";
  const SHELL_ID = "chaos-admin-shell";
  const DRAWER_ID = "chaos-admin-drawer";
  const MOBILE_NAV_ID = "chaos-mobile-nav";
  const INSTALL_BANNER_ID = "chaos-install-banner";
  const MANIFEST_URL = "/admin/media-manifest.json";
  const SYNC_STATUS_URL = "/admin/sync-status.json";
  const SITE_ORIGIN = "https://portfolio.chaoticstudio.workers.dev";

  const CARDS = [
    {
      title: "Social posts",
      desc: "Campaign rail, tags, images & reels",
      hash: "#/collections/campaign/entries/campaign-posts",
      icon: "📱",
      navLabel: "Posts",
    },
    {
      title: "Chaos Studio tab",
      desc: "Packages, pricing, services & studio contact",
      hash: "#/collections/chaos-studio/entries/studio-page",
      icon: "✦",
      navLabel: "Studio",
    },
    {
      title: "Site content",
      desc: "Hero, experience, skills & contact",
      hash: "#/collections/portfolio/entries/main",
      icon: "🏠",
      navLabel: "Site",
    },
    {
      title: "SEO & projects",
      desc: "Page title, work cards & covers",
      hash: "#/collections/site/entries/site-config",
      icon: "🔍",
      navLabel: "SEO",
    },
    {
      title: "All post images",
      desc: "Every image including carousel folders",
      hash: "#/media",
      icon: "🖼",
      navLabel: "Media",
    },
  ];

  const MOBILE_TABS = [
    { hash: "#/", label: "Home", icon: "⌂", isMenu: false },
    { hash: "#/collections/campaign/entries/campaign-posts", label: "Posts", icon: "📱", isMenu: false },
    { hash: "#/collections/chaos-studio/entries/studio-page", label: "Studio", icon: "✦", isMenu: false },
    { hash: "#/media", label: "Media", icon: "🖼", isMenu: false },
    { hash: "", label: "More", icon: "⋯", isMenu: true },
  ];

  let manifestCache = null;
  let deferredInstallPrompt = null;

  function route() {
    return location.hash || "#/";
  }

  function shouldShowWelcome() {
    const h = route();
    return h === "#/" || h === "" || h === "#/collections";
  }

  function isMediaRoute() {
    return route().includes("/media");
  }

  function isEditorRoute() {
    return route().includes("/entries/");
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function removeEl(id) {
    document.getElementById(id)?.remove();
  }

  function updateNavCurrent() {
    const h = route();
    document.querySelectorAll("[data-nav-hash]").forEach((el) => {
      const target = el.getAttribute("data-nav-hash") || "";
      const active =
        target === "#/"
          ? h === "#/" || h === "" || h === "#/collections"
          : h.includes(target.replace("#", ""));
      el.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" }).catch(() => {});
    });
  }

  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const banner = document.getElementById(INSTALL_BANNER_ID);
      if (banner && !localStorage.getItem("chaos-cms-install-dismissed")) {
        banner.hidden = false;
      }
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      document.getElementById(INSTALL_BANNER_ID)?.setAttribute("hidden", "");
    });
  }

  function injectInstallBanner() {
    if (document.getElementById(INSTALL_BANNER_ID)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("chaos-cms-install-dismissed")) return;

    const banner = document.createElement("aside");
    banner.id = INSTALL_BANNER_ID;
    banner.className = "chaos-install-banner";
    banner.hidden = true;
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Install app");
    banner.innerHTML = `
      <span>Add CMS to your home screen for quick edits.</span>
      <button type="button" class="chaos-install-banner__install">Install</button>
      <button type="button" class="chaos-install-banner__dismiss" aria-label="Dismiss">×</button>
    `;
    document.body.appendChild(banner);

    banner.querySelector(".chaos-install-banner__install")?.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        window.alert("Use your browser menu: Add to Home Screen / Install app.");
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      banner.hidden = true;
    });

    banner.querySelector(".chaos-install-banner__dismiss")?.addEventListener("click", () => {
      localStorage.setItem("chaos-cms-install-dismissed", "1");
      banner.hidden = true;
    });
  }

  function injectShell() {
    if (document.getElementById(SHELL_ID)) return;

    const shell = document.createElement("header");
    shell.id = SHELL_ID;
    shell.className = "chaos-admin-shell";
    shell.innerHTML = `
      <div class="chaos-admin-shell__brand">
        <img src="/icons/icon-192.png" width="32" height="32" alt="" />
        <div>
          <strong>Chaos Studio CMS</strong>
          <span data-sync-badge class="chaos-admin-shell__badge">CMS Admin</span>
        </div>
      </div>
      <nav class="chaos-admin-shell__nav" aria-label="Quick links">
        <a href="#/" data-nav-hash="#/">Dashboard</a>
        <a href="${SITE_ORIGIN}/" target="_blank" rel="noopener">View site</a>
      </nav>
      <button type="button" class="chaos-admin-shell__menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="${DRAWER_ID}-panel">☰</button>
    `;
    document.body.prepend(shell);
    document.body.classList.add("chaos-admin-ready");

    shell.querySelector(".chaos-admin-shell__menu-btn")?.addEventListener("click", () => {
      const drawer = document.getElementById(DRAWER_ID);
      const open = drawer?.classList.toggle("chaos-admin-drawer--open");
      shell.querySelector(".chaos-admin-shell__menu-btn")?.setAttribute("aria-expanded", open ? "true" : "false");
    });

    loadSyncBadge(shell.querySelector("[data-sync-badge]"));
  }

  async function loadSyncBadge(el) {
    if (!el) return;
    try {
      const res = await fetch(SYNC_STATUS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const ok = data.ok && data.mirrors?.every((m) => m.inSync);
      el.textContent = ok ? "In sync" : "Deploy pending";
    } catch {
      el.textContent = "Saves to GitHub";
    }
  }

  function injectDrawer() {
    if (document.getElementById(DRAWER_ID)) return;

    const drawer = document.createElement("div");
    drawer.id = DRAWER_ID;
    drawer.className = "chaos-admin-drawer";
    drawer.innerHTML = `
      <div class="chaos-admin-drawer__backdrop" tabindex="-1" aria-hidden="true"></div>
      <nav id="${DRAWER_ID}-panel" class="chaos-admin-drawer__panel" aria-label="CMS sections">
        <h2>Sections</h2>
        <div class="chaos-admin-drawer__links">
          <a href="#/" data-nav-hash="#/">Dashboard</a>
          ${CARDS.map((c) => `<a href="${c.hash}" data-nav-hash="${c.hash}">${c.icon} ${c.title}</a>`).join("")}
          <a href="${SITE_ORIGIN}/" target="_blank" rel="noopener">View live site ↗</a>
          <button type="button" data-install-from-menu>Install app</button>
        </div>
      </nav>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector(".chaos-admin-drawer__backdrop")?.addEventListener("click", closeDrawer);
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));
    drawer.querySelector("[data-install-from-menu]")?.addEventListener("click", () => {
      closeDrawer();
      document.querySelector(".chaos-install-banner__install")?.click();
    });
  }

  function closeDrawer() {
    document.getElementById(DRAWER_ID)?.classList.remove("chaos-admin-drawer--open");
    document
      .querySelector(".chaos-admin-shell__menu-btn")
      ?.setAttribute("aria-expanded", "false");
  }

  function injectMobileNav() {
    if (document.getElementById(MOBILE_NAV_ID)) return;

    const nav = document.createElement("nav");
    nav.id = MOBILE_NAV_ID;
    nav.className = "chaos-mobile-nav";
    nav.setAttribute("aria-label", "Quick navigation");
    nav.innerHTML = `
      <div class="chaos-mobile-nav__inner">
        ${MOBILE_TABS.map((t) =>
          t.isMenu
            ? `<button type="button" class="chaos-mobile-nav__more" data-open-drawer aria-label="More sections">
            <span class="chaos-mobile-nav__icon" aria-hidden="true">${t.icon}</span>${t.label}
          </button>`
            : `<a href="${t.hash}" data-nav-hash="${t.hash}">
            <span class="chaos-mobile-nav__icon" aria-hidden="true">${t.icon}</span>${t.label}
          </a>`,
        ).join("")}
      </div>
    `;
    nav.querySelector("[data-open-drawer]")?.addEventListener("click", () => {
      document.getElementById(DRAWER_ID)?.classList.add("chaos-admin-drawer--open");
      document.querySelector(".chaos-admin-shell__menu-btn")?.setAttribute("aria-expanded", "true");
    });
    document.body.appendChild(nav);

    const applyMobileNav = () => {
      if (isMobileLayout()) {
        document.body.classList.add("chaos-has-mobile-nav");
      } else {
        document.body.classList.remove("chaos-has-mobile-nav");
      }
    };
    applyMobileNav();
    window.matchMedia("(max-width: 768px)").addEventListener("change", applyMobileNav);
  }

  function injectPublishReminder() {
    if (window.__chaosPublishBound) return;
    window.__chaosPublishBound = true;
    document.body.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        const btn = t.closest("button");
        if (!btn) return;
        const label = (btn.textContent || "").toLowerCase();
        if (!label.includes("publish") && !label.includes("published")) return;
        setTimeout(() => {
          if (document.querySelector(".chaos-publish-toast")) return;
          const toast = document.createElement("div");
          toast.className = "chaos-publish-toast";
          toast.setAttribute("role", "status");
          toast.innerHTML =
            "<strong>Saved to GitHub.</strong> Live site updates in ~2 minutes. Hard-refresh if needed.";
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 8000);
        }, 600);
      },
      true,
    );
  }

  function injectEditorHelp() {
    document.querySelectorAll(".chaos-editor-help").forEach((n) => n.remove());
    if (!isEditorRoute()) return;

    const toolbar =
      document.querySelector('[class*="ToolbarContainer"]') ||
      document.querySelector('[class*="CollectionTop"]');
    if (!toolbar) return;

    const h = route();
    let text =
      "Edit the fields, then tap Publish. Wait for “saved” before leaving this screen.";
    if (h.includes("campaign-posts")) {
      text =
        "Post ID must match the image folder name. Tags: one per line. Tap Publish when done.";
    } else if (h.includes("chaos-studio")) {
      text = "Chaos Studio tab (/studio) — packages and pricing. Tap Publish to save.";
    } else if (h.includes("/portfolio/")) {
      text = "Home page only. For Studio packages use the Chaos Studio tab section.";
    } else if (h.includes("site-config")) {
      text = "SEO and project cards. Expand sections carefully.";
    }

    const bar = document.createElement("p");
    bar.className = "chaos-editor-help";
    bar.textContent = text;
    toolbar.after(bar);
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
      <h1>What do you want to edit?</h1>
      <p>Pick a section below, then tap <strong>Publish</strong> (top right). Changes go to GitHub and deploy in ~2 minutes.</p>
      <div class="chaos-cms-cards">${cardsHtml}</div>
      <div class="chaos-cms-links">
        <a href="${SITE_ORIGIN}/" target="_blank" rel="noopener">View live site</a>
        <a href="${SITE_ORIGIN}/studio" target="_blank" rel="noopener">Chaos Studio tab</a>
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
        <button type="button" class="chaos-media-item" data-copy="${copyValue.replace(/"/g, "&quot;")}" title="Tap to copy slide name">
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
      <p class="chaos-media-hint">Tip: tap an image to copy the <strong>slide name</strong> for CMS (e.g. <code>slide-02</code>).</p>
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
        '<p class="chaos-media-empty">Image list failed to load. Redeploy or run <code>npm run media:manifest</code>.</p>';
    }
  }

  function refresh() {
    updateNavCurrent();
    injectWelcome();
    injectEditorHelp();
    injectMediaBrowser();
  }

  function boot() {
    registerServiceWorker();
    setupInstallPrompt();
    injectShell();
    injectDrawer();
    injectMobileNav();
    injectInstallBanner();
    injectPublishReminder();
    refresh();

    window.addEventListener("hashchange", () => {
      closeDrawer();
      refresh();
    });

    const obs = new MutationObserver(() => refresh());
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
