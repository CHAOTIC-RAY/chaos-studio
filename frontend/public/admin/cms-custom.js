(function () {
  const SHELL_ID = "chaos-admin-shell";
  const DASHBOARD_ID = "chaos-admin-dashboard";
  const MEDIA_BROWSER_ID = "chaos-media-browser";
  const DRAWER_ID = "chaos-admin-drawer";
  const MOBILE_NAV_ID = "chaos-mobile-nav";
  const INSTALL_BANNER_ID = "chaos-install-banner";
  const SAVE_DOCK_ID = "chaos-save-dock";
  const CONTEXT_BAR_ID = "chaos-context-bar";
  const MANIFEST_URL = "/admin/media-manifest.json";
  const SYNC_STATUS_URL = "/admin/sync-status.json";
  const SITE = "https://portfolio.chaoticstudio.workers.dev";

  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/></svg>',
    posts: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="13" width="7" height="7" rx="1"/><rect x="14" y="13" width="7" height="7" rx="1"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    studio: '<svg viewBox="0 0 24 24"><path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3z"/></svg>',
    media: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="m21 15-5-5L5 19"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    external: '<svg viewBox="0 0 24 24"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v7H3V3h7"/></svg>',
  };

  function icon(name) {
    return `<span class="chaos-icon" aria-hidden="true">${ICONS[name] || ""}</span>`;
  }

  const MOBILE_TABS = [
    { hash: "#/", label: "Home", icon: "home", isMenu: false },
    {
      hash: "#/collections/campaign/entries/campaign-posts",
      label: "Posts",
      icon: "posts",
      isMenu: false,
    },
    {
      hash: "#/collections/chaos-studio/entries/studio-page",
      label: "Studio",
      icon: "studio",
      isMenu: false,
    },
    { hash: "#/media", label: "Media", icon: "media", isMenu: false },
    { hash: "", label: "More", icon: "more", isMenu: true },
  ];

  const SECTIONS = [
    {
      step: "1",
      title: "Social posts",
      desc: "Edit campaign cards, titles, tags, and which posts are visible.",
      hash: "#/collections/campaign/entries/campaign-posts",
      icon: "posts",
    },
    {
      step: "2",
      title: "Chaos Studio page",
      desc: "Packages, prices, services, and studio contact info.",
      hash: "#/collections/chaos-studio/entries/studio-page",
      icon: "studio",
    },
    {
      step: "3",
      title: "Home page text",
      desc: "Profile, experience, skills, and contact — not the Studio tab.",
      hash: "#/collections/portfolio/entries/main",
      icon: "home",
    },
    {
      step: "4",
      title: "SEO & project cards",
      desc: "Browser title, work thumbnails, and client logos.",
      hash: "#/collections/site/entries/site-config",
      icon: "search",
    },
    {
      step: "5",
      title: "Pictures",
      desc: "Upload images and browse every post folder.",
      hash: "#/media",
      icon: "media",
    },
  ];

  let manifestCache = null;
  let portalStatsCache = null;
  let deferredInstallPrompt = null;

  const ROUTE_LABELS = {
    "campaign-posts": "Social posts",
    "campaign-meta": "Campaign heading",
    "studio-page": "Chaos Studio page",
    main: "Home page text",
    "site-config": "SEO & project cards",
  };

  const COLLECTION_LABELS = {
    campaign: "Social posts",
    portfolio: "Site content",
    "chaos-studio": "Chaos Studio tab",
    site: "SEO & projects",
  };

  const MAIN_SLOT_ID = "chaos-main-slot";

  function getEntryLabel() {
    const h = route();
    for (const s of SECTIONS) {
      if (h.includes(s.hash.replace("#", ""))) return s.title;
    }
    const m = h.match(/entries\/([^/?#]+)/);
    if (m) {
      return ROUTE_LABELS[m[1]] || m[1].replace(/-/g, " ");
    }
    const coll = h.match(/^#\/collections\/([^/]+)/);
    if (coll && !h.includes("/entries/")) {
      return COLLECTION_LABELS[coll[1]] || coll[1].replace(/-/g, " ");
    }
    if (h.includes("/media")) return "Media library";
    if (isPortalHome()) return "Portal home";
    return "Contents";
  }

  function getMainPane() {
    const split = document.querySelector('[class*="SplitPane"]');
    if (split && split.children.length >= 1) {
      return split.children[split.children.length - 1];
    }
    const wf = document.querySelector('[class*="WorkflowWrapper"]');
    if (wf) {
      for (let i = wf.children.length - 1; i >= 0; i--) {
        const child = wf.children[i];
        if (!child.className || !String(child.className).includes("Sidebar")) {
          return child;
        }
      }
    }
    return document.querySelector('[class*="AppMainContainer"]');
  }

  function getMainSlot() {
    const pane = getMainPane();
    if (!pane) return null;
    let slot = document.getElementById(MAIN_SLOT_ID);
    if (!slot) {
      slot = document.createElement("div");
      slot.id = MAIN_SLOT_ID;
      slot.className = "chaos-main-slot";
      pane.insertBefore(slot, pane.firstChild);
    }
    return slot;
  }

  function needsContextBar() {
    return isEditor() || isCampaignPosts() || isMedia() || route().includes("/collections/");
  }

  async function fetchPortalStats() {
    if (portalStatsCache) return portalStatsCache;
    const stats = {
      posts: 0,
      images: 0,
      syncOk: true,
      sections: SECTIONS.length,
    };
    try {
      const [portfolioRes, manifestRes, syncRes] = await Promise.all([
        fetch(`${SITE}/api/portfolio`, { cache: "no-store" }),
        fetch(MANIFEST_URL, { cache: "no-store" }),
        fetch(SYNC_STATUS_URL, { cache: "no-store" }),
      ]);
      if (portfolioRes.ok) {
        const p = await portfolioRes.json();
        stats.posts = p.socialPosts?.items?.length ?? 0;
      }
      if (manifestRes.ok) {
        const m = await manifestRes.json();
        stats.images = m.files?.length ?? 0;
      }
      if (syncRes.ok) {
        const s = await syncRes.json();
        stats.syncOk = Boolean(s.ok && s.mirrors?.every((x) => x.inSync));
      }
    } catch {
      /* keep defaults */
    }
    portalStatsCache = stats;
    return stats;
  }

  function renderKpiRow(stats) {
    return `
      <div class="chaos-kpi-row" role="group" aria-label="Site overview">
        <div class="chaos-kpi">
          <span class="chaos-kpi__value">${stats.posts}</span>
          <span class="chaos-kpi__label">Live posts</span>
        </div>
        <div class="chaos-kpi">
          <span class="chaos-kpi__value">${stats.images}</span>
          <span class="chaos-kpi__label">Images indexed</span>
        </div>
        <div class="chaos-kpi">
          <span class="chaos-kpi__value">${stats.sections}</span>
          <span class="chaos-kpi__label">Edit sections</span>
        </div>
        <div class="chaos-kpi ${stats.syncOk ? "chaos-kpi--ok" : "chaos-kpi--warn"}">
          <span class="chaos-kpi__value">${stats.syncOk ? "OK" : "Pending"}</span>
          <span class="chaos-kpi__label">GitHub sync</span>
        </div>
      </div>`;
  }

  function route() {
    return location.hash || "#/";
  }

  function isPortalHome() {
    const h = route();
    return h === "#/" || h === "" || h === "#/collections";
  }

  function isHome() {
    return isPortalHome();
  }

  function isCollectionGroup() {
    const h = route();
    return /^#\/collections\/[^/]+$/.test(h);
  }

  function normalizeRoute() {
    const h = location.hash || "";
    if (h === "" || h === "#/collections") {
      if (location.hash !== "#/") {
        location.replace("#/");
      }
    }
  }

  function isMedia() {
    return route().includes("/media");
  }

  function isEditor() {
    return route().includes("/entries/");
  }

  function isCampaignPosts() {
    return route().includes("campaign-posts");
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
      let active = false;
      if (target === "#/") {
        active = h === "#/" || h === "" || h === "#/collections";
      } else if (target === "#/media") {
        active = h.includes("/media");
      } else if (target === "#/" || target === "#/collections") {
        active = h === "#/" || h === "" || h === "#/collections";
      } else {
        active = h.includes(target.replace("#", ""));
      }
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
        updateChromeClasses();
      }
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      document.getElementById(INSTALL_BANNER_ID)?.setAttribute("hidden", "");
      updateChromeClasses();
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
    updateChromeClasses();

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
      updateChromeClasses();
    });
  }

  function updateChromeClasses() {
    const h = route();
    document.body.classList.toggle("chaos-route-home", isPortalHome());
    document.body.classList.toggle("chaos-route-editor", isEditor());
    document.body.classList.toggle("chaos-route-posts-list", isCampaignPosts());
    document.body.classList.toggle("chaos-route-media", isMedia());
    document.body.classList.toggle("chaos-route-collection", isCollectionGroup());

    const banner = document.getElementById(INSTALL_BANNER_ID);
    const bannerVisible =
      banner && !banner.hidden && !window.matchMedia("(display-mode: standalone)").matches;
    document.body.classList.toggle("chaos-banner-visible", Boolean(bannerVisible));
  }

  function injectShell() {
    if (document.getElementById(SHELL_ID)) return;

    const shell = document.createElement("header");
    shell.id = SHELL_ID;
    shell.className = "chaos-admin-shell";
    shell.innerHTML = `
      <div class="chaos-admin-shell__brand">
        <img src="/icons/icon-192.png" width="36" height="36" alt="" />
        <div>
          <strong>Chaos Studio Admin</strong>
          <span data-sync-badge class="chaos-admin-shell__badge">Checking sync…</span>
        </div>
      </div>
      <nav class="chaos-admin-shell__tabs" aria-label="CMS mode">
        <a href="#/" data-nav-hash="#/">${icon("file")} Contents</a>
        <a href="#/media" data-nav-hash="#/media">${icon("media")} Media</a>
      </nav>
      <nav class="chaos-admin-shell__nav" aria-label="Quick links">
        <a href="#/" data-nav-hash="#/">Dashboard</a>
        <a href="${SITE}/" target="_blank" rel="noopener">View site</a>
      </nav>
      <button type="button" class="chaos-admin-shell__menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="${DRAWER_ID}-panel">${icon("menu")}</button>
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
          ${SECTIONS.map((s) => `<a href="${s.hash}" data-nav-hash="${s.hash}">${icon(s.icon)} ${s.title}</a>`).join("")}
          <a href="${SITE}/" target="_blank" rel="noopener">${icon("external")} View live site</a>
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
    document.querySelector(".chaos-admin-shell__menu-btn")?.setAttribute("aria-expanded", "false");
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
            ${icon(t.icon)}${t.label}
          </button>`
            : `<a href="${t.hash}" data-nav-hash="${t.hash}">
            ${icon(t.icon)}${t.label}
          </a>`,
        ).join("")}
      </div>
    `;
    document.body.appendChild(nav);

    nav.querySelector("[data-open-drawer]")?.addEventListener("click", () => {
      document.getElementById(DRAWER_ID)?.classList.add("chaos-admin-drawer--open");
      document.querySelector(".chaos-admin-shell__menu-btn")?.setAttribute("aria-expanded", "true");
    });

    const applyMobileNav = () => {
      document.body.classList.toggle("chaos-has-mobile-nav", isMobileLayout());
    };
    applyMobileNav();
    window.matchMedia("(max-width: 768px)").addEventListener("change", applyMobileNav);
  }

  async function loadSyncBadge(el) {
    if (!el) return;
    try {
      const res = await fetch(SYNC_STATUS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const ok = data.ok && data.mirrors?.every((m) => m.inSync);
      el.textContent = ok ? "In sync with GitHub" : "Sync pending on next deploy";
      el.classList.toggle("chaos-admin-shell__badge--ok", ok);
      el.classList.toggle("chaos-admin-shell__badge--warn", !ok);
    } catch {
      el.textContent = "Publish saves to GitHub · main";
      el.classList.add("chaos-admin-shell__badge--ok");
    }
  }

  function renderDashboardCards() {
    return SECTIONS.map((s) => {
      const featured = s.hash.includes("campaign-posts") ? " chaos-admin-card--featured" : "";
      return `
        <a class="chaos-admin-card${featured}" href="${s.hash}">
          <span class="chaos-admin-card__step">${s.step}</span>
          <span class="chaos-admin-card__icon">${icon(s.icon)}</span>
          <strong>${s.title}</strong>
          <span>${s.desc}</span>
        </a>`;
    }).join("");
  }

  async   function injectDashboard() {
    if (!isPortalHome()) {
      removeEl(DASHBOARD_ID);
      document.body.classList.remove("chaos-route-home");
      return;
    }
    document.body.classList.add("chaos-route-home");

    const slot = getMainSlot();
    if (!slot) {
      setTimeout(() => injectDashboard(), 300);
      return;
    }

    let panel = document.getElementById(DASHBOARD_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = DASHBOARD_ID;
      panel.className = "chaos-admin-dashboard";
      slot.appendChild(panel);
    } else if (panel.parentElement !== slot) {
      slot.appendChild(panel);
    }

    panel.innerHTML = `
      <div class="chaos-admin-dashboard__hero">
        <h1>Content portal</h1>
        <p>Edit portfolio content, campaign posts, and media. Publish saves to GitHub — the live site updates in ~2 minutes.</p>
      </div>
      <div data-kpi-host><div class="chaos-kpi-row" aria-busy="true"><div class="chaos-kpi"><span class="chaos-kpi__value">…</span><span class="chaos-kpi__label">Loading</span></div></div></div>
      <div class="chaos-admin-dashboard__grid">${renderDashboardCards()}</div>
      <aside class="chaos-admin-dashboard__note">
        <strong>Workflow:</strong> Open a section → edit fields → use the <strong>Publish</strong> bar at the bottom → hard-refresh the site after deploy.
      </aside>
    `;

    portalStatsCache = null;
    const stats = await fetchPortalStats();
    panel.querySelector("[data-kpi-host]").innerHTML = renderKpiRow(stats);
  }

  function injectContextBar() {
    if (!needsContextBar() || isPortalHome()) {
      removeEl(CONTEXT_BAR_ID);
      return;
    }

    const slot = getMainSlot();
    if (!slot) {
      setTimeout(injectContextBar, 200);
      return;
    }

    let bar = document.getElementById(CONTEXT_BAR_ID);
    if (!bar) {
      bar = document.createElement("nav");
      bar.id = CONTEXT_BAR_ID;
      bar.className = "chaos-context-bar";
      bar.setAttribute("aria-label", "Breadcrumb");
    }
    slot.insertBefore(bar, slot.firstChild);

    const current = getEntryLabel();
    bar.innerHTML = `
      <a href="#/">Dashboard</a>
      <span class="chaos-context-bar__sep" aria-hidden="true">/</span>
      <span class="chaos-context-bar__current">${escapeHtml(current)}</span>
    `;
  }

  function enhanceSidebar() {
    const sidebar = document.querySelector('[class*="Sidebar"]');
    if (!sidebar || sidebar.querySelector(".chaos-sidebar-title")) return;
    const title = document.createElement("p");
    title.className = "chaos-sidebar-title";
    title.textContent = "Content files";
    sidebar.prepend(title);
  }

  let lastEditorHelpRoute = "";

  function injectEditorHelp() {
    if (!isEditor()) {
      document.querySelectorAll(".chaos-editor-help").forEach((n) => n.remove());
      lastEditorHelpRoute = "";
      return;
    }

    const h = route();
    if (h === lastEditorHelpRoute && document.querySelector(".chaos-editor-help")) return;

    document.querySelectorAll(".chaos-editor-help").forEach((n) => n.remove());
    lastEditorHelpRoute = h;

    const toolbar =
      document.querySelector('[class*="ToolbarContainer"]') ||
      document.querySelector('[class*="CollectionTop"]');
    if (!toolbar) return;

    let text =
      "Edit the fields below, then tap Publish in the bar at the bottom. Wait for the saved confirmation before closing.";
    if (h.includes("campaign-meta")) {
      text = "Campaign section subtitle on the home page. Click Publish when done.";
    } else if (h.includes("campaign-posts")) {
      text =
        "Each post needs a Post ID that matches its image folder. Tags: one keyword per line. Click Publish when finished.";
    } else if (h.includes("chaos-studio")) {
      text = "This is the /studio page — packages, pricing, and studio contact. Click Publish to save.";
    } else if (h.includes("/portfolio/")) {
      text = "Home page content only. For Studio packages, use “Chaos Studio page” on the dashboard.";
    } else if (h.includes("site-config")) {
      text = "Page title and project cards. Expand each section carefully — do not delete fields you do not recognize.";
    }

    const bar = document.createElement("p");
    bar.className = "chaos-editor-help";
    bar.textContent = text;
    toolbar.after(bar);
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
        if (label.includes("publish") || label.includes("published") || label.includes("save")) {
          setTimeout(() => {
            if (!document.querySelector(".chaos-publish-toast")) {
              const toast = document.createElement("div");
              toast.className = "chaos-publish-toast";
              toast.setAttribute("role", "status");
              toast.setAttribute("aria-live", "polite");
              toast.innerHTML =
                "<strong>Saved to GitHub.</strong> Deploy runs in ~2 minutes. Hard-refresh the portfolio to preview changes.";
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 8000);
            }
            injectSaveDock();
          }, 600);
        }
      },
      true,
    );
  }

  async function loadManifest() {
    if (manifestCache) return manifestCache;
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error();
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
    if (!filtered.length) return `<p class="chaos-media-empty">No images match.</p>`;
    return `<div class="chaos-media-grid">${filtered
      .map((f) => {
        const copyValue = f.slideBasename || f.name.replace(/\.[^.]+$/, "");
        return `
        <button type="button" class="chaos-media-item" data-copy="${copyValue.replace(/"/g, "&quot;")}">
          <img src="${SITE}${f.url}" alt="" loading="lazy" />
          <span class="chaos-media-item__folder">${f.folder}</span>
          <span class="chaos-media-item__name">${f.name}</span>
        </button>`;
      })
      .join("")}</div>`;
  }

  async function injectMediaBrowser() {
    if (!isMedia()) {
      removeEl(MEDIA_BROWSER_ID);
      document.body.classList.remove("chaos-route-media");
      return;
    }
    document.body.classList.add("chaos-route-media");
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
      <h2>All post images</h2>
      <p class="chaos-media-browser__lead">The grid below only shows root uploads. <strong>This list shows every image</strong> including carousel folders.</p>
      <div class="chaos-media-browser__tools">
        <input type="search" class="chaos-media-search" placeholder="Search…" aria-label="Search images" />
        <select class="chaos-media-folder" aria-label="Folder"><option value="all">All folders</option></select>
      </div>
      <p class="chaos-media-hint">Click an image to copy its <strong>slide name</strong> (e.g. <code>slide-02</code>) into Social posts.</p>
      <div data-media-grid><p class="chaos-media-empty">Loading…</p></div>
    `;
    host.prepend(panel);

    const search = panel.querySelector(".chaos-media-search");
    const folderSelect = panel.querySelector(".chaos-media-folder");
    const gridHost = panel.querySelector("[data-media-grid]");

    try {
      const data = await loadManifest();
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
              window.prompt("Copy into CMS:", text);
            }
          });
        });
      };
      search.addEventListener("input", paint);
      folderSelect.addEventListener("change", paint);
      paint();
    } catch {
      gridHost.innerHTML = "<p class=\"chaos-media-empty\">Could not load images. Try again after deploy.</p>";
    }
  }

  const POSTS_STUDIO_ID = "chaos-posts-studio";
  let postThumbIndex = null;
  let enhanceTimer = null;

  async function loadPostThumbIndex() {
    if (postThumbIndex) return postThumbIndex;
    try {
      const res = await fetch(`${SITE}/api/portfolio`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const byId = new Map();
      const bySummary = new Map();
      for (const p of data.socialPosts?.items || []) {
        byId.set(p.id, { thumb: postThumbUrl(p), post: p });
        bySummary.set(summaryKey(p.client, p.title), p.id);
      }
      postThumbIndex = { byId, bySummary, items: data.socialPosts?.items || [] };
    } catch {
      postThumbIndex = { byId: new Map(), bySummary: new Map(), items: [] };
    }
    return postThumbIndex;
  }

  function summaryKey(client, title) {
    return `${client || ""} — ${title || ""}`.toLowerCase().trim();
  }

  function postThumbUrl(post) {
    if (post.slides?.length) {
      return `${SITE}/images/posts/${post.id}/${post.slides[0]}.webp`;
    }
    const base = (post.image || "").trim() || post.id;
    return `${SITE}/images/posts/${base}.webp`;
  }

  function extractPostIdFromListItem(li) {
    for (const label of li.querySelectorAll("label, [class*='ControlLabel']")) {
      if (!/post id/i.test(label.textContent || "")) continue;
      const field =
        label.closest("[class*='Control']") ||
        label.closest("[class*='Widget']") ||
        label.parentElement;
      const input = field?.querySelector("input, textarea");
      const val = input?.value?.trim();
      if (val) return val;
    }
    const meta = li.querySelector("[class*='ListItemMeta']");
    const text = meta?.textContent?.trim().toLowerCase();
    if (text && postThumbIndex?.bySummary.has(text)) {
      return postThumbIndex.bySummary.get(text);
    }
    return null;
  }

  function scheduleEnhancePosts() {
    if (!isCampaignPosts()) return;
    clearTimeout(enhanceTimer);
    enhanceTimer = setTimeout(() => {
      enhancePostLists().catch(() => {});
      updateExpandedPostPreview().catch(() => {});
      refreshPostsStudioCounts();
    }, 180);
  }

  function isCampaignPostRow(li) {
    const meta = li.querySelector("[class*='ListItemMeta']");
    if (!meta) return false;
    return / — /.test(meta.textContent || "");
  }

  function stripBadListEnhancements() {
    document.querySelectorAll("[class*='ListItem'].chaos-list-item--enhanced").forEach((li) => {
      if (!isCampaignPostRow(li)) {
        li.classList.remove("chaos-list-item--enhanced");
        li.querySelector(".chaos-list-item__thumb-wrap")?.remove();
        delete li.dataset.chaosPostId;
      }
    });
  }

  async function enhancePostLists() {
    if (!isCampaignPosts()) {
      stripBadListEnhancements();
      return;
    }
    stripBadListEnhancements();
    const index = await loadPostThumbIndex();
    document.querySelectorAll("[class*='ListItem']").forEach((li) => {
      if (li.closest(`#${POSTS_STUDIO_ID}`)) return;
      if (!isCampaignPostRow(li)) return;

      const id = extractPostIdFromListItem(li);
      const entry = id ? index.byId.get(id) : null;
      const thumb = entry?.thumb;

      let wrap = li.querySelector(".chaos-list-item__thumb-wrap");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "chaos-list-item__thumb-wrap";
        const header = li.querySelector("[class*='ListItemHeader']");
        if (header) {
          header.insertBefore(wrap, header.firstChild);
        } else {
          li.prepend(wrap);
        }
        li.classList.add("chaos-list-item--enhanced");
      }

      if (thumb) {
        wrap.innerHTML = `<img class="chaos-list-item__thumb" src="${thumb}" alt="" loading="lazy" />`;
      } else {
        wrap.innerHTML = `<div class="chaos-list-item__thumb chaos-list-item__thumb--empty">${icon("image")}</div>`;
      }
      if (id) li.dataset.chaosPostId = id;
    });
  }

  async function updateExpandedPostPreview() {
    document.querySelectorAll(".chaos-post-edit-preview").forEach((n) => n.remove());
    if (!isCampaignPosts()) return;

    const expandedBtn = document.querySelector(
      "[class*='ListItem'] button[aria-expanded='true']",
    );
    const li = expandedBtn?.closest("[class*='ListItem']");
    if (!li) return;

    const index = await loadPostThumbIndex();
    const id = li.dataset.chaosPostId || extractPostIdFromListItem(li);
    const entry = id ? index.byId.get(id) : null;
    const post = entry?.post;
    const thumb = entry?.thumb;

    const bar = document.createElement("div");
    bar.className = "chaos-post-edit-preview";
    bar.setAttribute("role", "img");
    bar.setAttribute(
      "aria-label",
      post ? `Preview: ${post.client} — ${post.title}` : "Post preview",
    );
    const title = post?.title || li.querySelector("[class*='ListItemMeta']")?.textContent || "Post";
    const client = post?.client || "";
    bar.innerHTML = `
      ${
        thumb
          ? `<img class="chaos-post-edit-preview__img" src="${thumb}" alt="" />`
          : `<div class="chaos-post-edit-preview__img chaos-list-item__thumb--empty">${icon("image")}</div>`
      }
      <div class="chaos-post-edit-preview__meta">
        <strong>${escapeHtml(client ? `${client} — ${title}` : title)}</strong>
        ${id ? `<span class="chaos-post-edit-preview__id">${escapeHtml(id)}</span>` : ""}
        <span>Folder: images/posts/${escapeHtml(id || "…")}/</span>
      </div>
    `;

    const body =
      li.querySelector("[class*='ListItemBody']") ||
      li.querySelector("[class*='NestedObjectContainer']") ||
      expandedBtn?.parentElement?.nextElementSibling;
    if (body) body.prepend(bar);
    else li.appendChild(bar);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function injectPostsStudio() {
    if (!isCampaignPosts()) {
      removeEl(POSTS_STUDIO_ID);
      return;
    }

    const slot = getMainSlot();
    if (!slot) return;

    let studio = document.getElementById(POSTS_STUDIO_ID);
    if (!studio) {
      studio = document.createElement("section");
      studio.id = POSTS_STUDIO_ID;
      studio.className = "chaos-posts-studio";
    }
    const hub = document.getElementById(COLLECTION_HUB_ID);
    const bar = document.getElementById(CONTEXT_BAR_ID);
    if (bar && bar.parentElement === slot) {
      slot.insertBefore(studio, bar.nextSibling);
    } else if (hub && hub.parentElement === slot) {
      slot.insertBefore(studio, hub.nextSibling);
    } else {
      slot.insertBefore(studio, slot.firstChild);
    }
    if (studio.dataset.built === "1") {
      refreshPostsStudioCounts();
      filterPostListItems(studio);
      return;
    }
    studio.dataset.built = "1";
    studio.innerHTML = `
        <div class="chaos-posts-studio__head">
          <div>
            <h2>Posts studio</h2>
            <div class="chaos-posts-studio__stats" data-posts-stats></div>
          </div>
        </div>
        <div class="chaos-posts-studio__tools">
          <input type="search" class="chaos-posts-studio__search" placeholder="Search client, title, or ID…" aria-label="Search posts" />
          <select class="chaos-posts-studio__filter" aria-label="Filter by client">
            <option value="">All clients</option>
          </select>
          <select class="chaos-posts-studio__view" aria-label="List layout">
            <option value="list">List view</option>
            <option value="grid">Grid view</option>
          </select>
        </div>
        <p class="chaos-posts-studio__hint" data-posts-hint hidden>
          Large file — first load can take 30–60s on mobile. Thumbnails appear as items render.
        </p>
      `;
      const search = studio.querySelector(".chaos-posts-studio__search");
      const filter = studio.querySelector(".chaos-posts-studio__filter");
      const view = studio.querySelector(".chaos-posts-studio__view");

      search.addEventListener("input", () => filterPostListItems(studio));
      filter.addEventListener("change", () => filterPostListItems(studio));
      view.addEventListener("change", () => {
        document.body.classList.toggle("chaos-posts-grid-view", view.value === "grid");
        document.body.classList.toggle("chaos-posts-studio-expanded", view.value === "grid");
      });

      loadPostThumbIndex().then((index) => {
        const clients = [...new Set(index.items.map((p) => p.client).filter(Boolean))].sort();
        for (const c of clients) {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c;
          filter.appendChild(opt);
        }
        refreshPostsStudioCounts();
      });

      studio.querySelector("[data-posts-hint]")?.removeAttribute("hidden");
    }

    refreshPostsStudioCounts();
    filterPostListItems(studio);
  }

  function filterPostListItems(studio) {
    if (!studio) studio = document.getElementById(POSTS_STUDIO_ID);
    if (!studio) return;

    const q = (studio.querySelector(".chaos-posts-studio__search")?.value || "")
      .trim()
      .toLowerCase();
    const client = studio.querySelector(".chaos-posts-studio__filter")?.value || "";

    document.querySelectorAll("[class*='ListItem']").forEach((li) => {
      if (li.closest(`#${POSTS_STUDIO_ID}`)) return;
      const text = (li.textContent || "").toLowerCase();
      const id = (li.dataset.chaosPostId || "").toLowerCase();
      const matchQ = !q || text.includes(q) || id.includes(q);
      const matchClient = !client || text.includes(client.toLowerCase());
      li.classList.toggle("chaos-list-item--hidden", !(matchQ && matchClient));
    });
  }

  function refreshPostsStudioCounts() {
    const stats = document.querySelector("[data-posts-stats]");
    if (!stats) return;

    const items = [...document.querySelectorAll("[class*='ListItem']")].filter(
      (li) => !li.closest(`#${POSTS_STUDIO_ID}`),
    );
    const visible = items.filter((li) => !li.classList.contains("chaos-list-item--hidden"));
    const expanded = document.querySelectorAll(
      "[class*='ListItem'] button[aria-expanded='true']",
    ).length;

    stats.innerHTML = `
      <span class="chaos-posts-studio__stat"><strong>${visible.length}</strong> shown</span>
      <span class="chaos-posts-studio__stat"><strong>${items.length}</strong> total</span>
      ${
        expanded
          ? `<span class="chaos-posts-studio__stat"><strong>${expanded}</strong> editing</span>`
          : ""
      }
    `;
  }

  function setupPostListObserver() {
    if (window.__chaosPostListObserver) return;
    const attach = () => {
      const root = document.getElementById("nc-root");
      if (!root) {
        setTimeout(attach, 400);
        return;
      }
      window.__chaosPostListObserver = true;
      const obs = new MutationObserver((mutations) => {
        if (!isCampaignPosts()) return;
        const touchList = mutations.some((m) => {
          for (const n of m.addedNodes) {
            if (!(n instanceof Element)) continue;
            if (n.matches?.("[class*='ListItem']") || n.querySelector?.("[class*='ListItem']")) {
              return true;
            }
          }
          return false;
        });
        if (touchList || mutations.some((m) => m.type === "attributes")) {
          scheduleEnhancePosts();
        }
      });
      obs.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-expanded", "class"],
      });
    };
    attach();
  }

  function findEditorToolbar() {
    return (
      document.querySelector('[class*="ToolbarContainer"]') ||
      document.querySelector('[class*="EditorControlBar"]') ||
      document.querySelector('[class*="EditEntryMain"] [class*="Toolbar"]')
    );
  }

  function isActionButton(btn) {
    const label = (btn.textContent || "").trim().toLowerCase();
    if (!label) return false;
    return (
      label.includes("publish") ||
      label.includes("save") ||
      label.includes("delete") ||
      label.includes("status") ||
      label.includes("draft")
    );
  }

  function injectSaveDock() {
    if (!isEditor()) {
      removeEl(SAVE_DOCK_ID);
      document.body.classList.remove("chaos-has-save-dock");
      return;
    }

    const toolbar = findEditorToolbar();
    if (!toolbar) {
      setTimeout(injectSaveDock, 250);
      return;
    }

    const buttons = [...toolbar.querySelectorAll("button")].filter(isActionButton);
    if (!buttons.length) {
      setTimeout(injectSaveDock, 400);
      return;
    }

    let dock = document.getElementById(SAVE_DOCK_ID);
    if (!dock) {
      dock = document.createElement("div");
      dock.id = SAVE_DOCK_ID;
      dock.className = "chaos-save-dock";
      dock.setAttribute("role", "toolbar");
      dock.setAttribute("aria-label", "Save and publish");
      document.body.appendChild(dock);
    }

    dock.replaceChildren();
    const label = document.createElement("span");
    label.className = "chaos-save-dock__label";
    label.textContent = `Editing: ${getEntryLabel()}`;
    dock.appendChild(label);

    for (const btn of buttons) {
      const text = (btn.textContent || "").trim();
      const lower = text.toLowerCase();
      const action = document.createElement("button");
      action.type = "button";
      action.className = "chaos-save-dock__btn";
      action.textContent = text;
      action.disabled = btn.disabled;
      if (lower.includes("publish") || lower.includes("save")) {
        action.classList.add("chaos-save-dock__btn--primary");
      }
      if (lower.includes("delete")) {
        action.classList.add("chaos-save-dock__btn--danger");
      }
      action.addEventListener("click", () => {
        if (lower.includes("publish") || lower.includes("save")) {
          action.classList.add("is-saving");
          action.disabled = true;
          action.textContent = lower.includes("publish") ? "Publishing…" : "Saving…";
        }
        btn.click();
        setTimeout(() => injectSaveDock(), 2500);
      });
      dock.appendChild(action);
    }

    document.body.classList.add("chaos-has-save-dock");
  }

  function setupSaveDockObserver() {
    if (window.__chaosSaveDockObserver) return;
    const attach = () => {
      const root = document.getElementById("nc-root");
      if (!root) {
        setTimeout(attach, 400);
        return;
      }
      window.__chaosSaveDockObserver = true;
      let dockTimer = null;
      const obs = new MutationObserver(() => {
        if (!isEditor()) return;
        clearTimeout(dockTimer);
        dockTimer = setTimeout(injectSaveDock, 120);
      });
      obs.observe(root, { childList: true, subtree: true });
    };
    attach();
  }

  const COLLECTION_HUB_ID = "chaos-collection-hub";

  function injectCollectionHub() {
    if (!isCollectionGroup()) {
      removeEl(COLLECTION_HUB_ID);
      return;
    }
    const slot = getMainSlot();
    if (!slot) return;

    let hub = document.getElementById(COLLECTION_HUB_ID);
    if (!hub) {
      hub = document.createElement("section");
      hub.id = COLLECTION_HUB_ID;
      hub.className = "chaos-collection-hub";
    }
    const bar = document.getElementById(CONTEXT_BAR_ID);
    if (bar && bar.parentElement === slot) {
      slot.insertBefore(hub, bar.nextSibling);
    } else {
      slot.insertBefore(hub, slot.firstChild);
    }

    const label = getEntryLabel();
    hub.innerHTML = `
      <a class="chaos-collection-hub__back" href="#/">${icon("home")} Portal home</a>
      <h2>${escapeHtml(label)}</h2>
      <p>Choose a file below to edit. For all campaign posts at once, open <strong>All posts</strong>.</p>
    `;
  }

  function onRouteChange() {
    normalizeRoute();
    updateNavCurrent();
    updateChromeClasses();
    injectDashboard();
    injectCollectionHub();
    injectContextBar();
    enhanceSidebar();
    injectEditorHelp();
    injectMediaBrowser();
    injectPostsStudio();
    injectSaveDock();
    scheduleEnhancePosts();
  }

  function initChrome() {
    injectShell();
    injectDrawer();
    injectMobileNav();
    injectInstallBanner();
    injectPublishReminder();
    registerCmsHooks();
  }

  function normalizeListValue(val, prop) {
    if (!Array.isArray(val)) return val;
    return val.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && prop in item) return String(item[prop]);
      return String(item ?? "");
    });
  }

  function normalizeEntryLists(entry) {
    if (!entry?.data) return entry;
    const d = entry.data;
    if (Array.isArray(d.posts)) {
      for (const p of d.posts) {
        if (p.tags) p.tags = normalizeListValue(p.tags, "tag");
        if (p.slides) p.slides = normalizeListValue(p.slides, "slide");
      }
    }
    if (d.softSkills) d.softSkills = normalizeListValue(d.softSkills, "skill");
    if (d.experience?.items) {
      for (const job of d.experience.items) {
        if (job.bullets) job.bullets = normalizeListValue(job.bullets, "bullet");
      }
    }
    if (d.featuredWork?.projects) {
      for (const proj of d.featuredWork.projects) {
        if (proj.highlights) proj.highlights = normalizeListValue(proj.highlights, "line");
        if (proj.tags) proj.tags = normalizeListValue(proj.tags, "tag");
      }
    }
    if (d.skills?.categories) {
      for (const cat of d.skills.categories) {
        if (cat.tools) cat.tools = normalizeListValue(cat.tools, "tool");
      }
    }
    if (d.highlights) d.highlights = normalizeListValue(d.highlights, "line");
    if (d.services) d.services = normalizeListValue(d.services, "service");
    if (d.packages) {
      for (const pkg of d.packages) {
        if (pkg.features) pkg.features = normalizeListValue(pkg.features, "feature");
      }
    }
    if (d.about?.skills) d.about.skills = normalizeListValue(d.about.skills, "skill");
    return entry;
  }

  function registerCmsHooks() {
    if (window.__chaosCmsHooks || !window.CMS?.registerEventListener) return;
    window.__chaosCmsHooks = true;
    try {
      window.CMS.registerEventListener({
        name: "preLoad",
        handler: ({ entry }) => normalizeEntryLists(entry),
      });
    } catch (e) {
      console.warn("[CMS] preLoad hook failed", e);
    }
  }

  function bindCmsErrorToast() {
    if (window.__chaosCmsErrorBound) return;
    window.__chaosCmsErrorBound = true;
    window.addEventListener("unhandledrejection", (e) => {
      const msg = e.reason?.message || String(e.reason || "");
      if (!/cms|decap|github|entry|widget/i.test(msg)) return;
      console.error("[CMS]", e.reason);
      if (document.querySelector(".chaos-cms-error-toast")) return;
      const toast = document.createElement("div");
      toast.className = "chaos-cms-error-toast chaos-publish-toast";
      toast.setAttribute("role", "alert");
      toast.innerHTML = `<strong>CMS could not load this entry.</strong> Hard-refresh the page. If it persists, check the browser console.`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 12000);
    });
  }

  function boot() {
    normalizeRoute();
    bindCmsErrorToast();
    registerServiceWorker();
    setupInstallPrompt();
    initChrome();
    setupPostListObserver();
    setupSaveDockObserver();
    onRouteChange();
    window.addEventListener("hashchange", () => {
      closeDrawer();
      onRouteChange();
    });
    window.addEventListener("load", () => {
      setTimeout(() => {
        registerCmsHooks();
        onRouteChange();
        injectSaveDock();
        scheduleEnhancePosts();
      }, 1500);
      setTimeout(scheduleEnhancePosts, 3500);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
