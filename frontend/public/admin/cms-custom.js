(function () {
  const SHELL_ID = "chaos-admin-shell";
  const DASHBOARD_ID = "chaos-admin-dashboard";
  const MEDIA_BROWSER_ID = "chaos-media-browser";
  const MANIFEST_URL = "/admin/media-manifest.json";
  const SYNC_STATUS_URL = "/admin/sync-status.json";
  const SITE = "https://portfolio.chaoticstudio.workers.dev";

  const SECTIONS = [
    {
      step: "1",
      title: "Social posts",
      desc: "Edit campaign cards, titles, tags, and which posts are visible.",
      hash: "#/collections/campaign/entries/campaign-posts",
      icon: "📱",
    },
    {
      step: "2",
      title: "Chaos Studio page",
      desc: "Packages, prices, services, and studio contact info.",
      hash: "#/collections/chaos-studio/entries/studio-page",
      icon: "✦",
    },
    {
      step: "3",
      title: "Home page text",
      desc: "Profile, experience, skills, and contact — not the Studio tab.",
      hash: "#/collections/portfolio/entries/main",
      icon: "🏠",
    },
    {
      step: "4",
      title: "SEO & project cards",
      desc: "Browser title, work thumbnails, and client logos.",
      hash: "#/collections/site/entries/site-config",
      icon: "🔍",
    },
    {
      step: "5",
      title: "Pictures",
      desc: "Upload images and browse every post folder.",
      hash: "#/media",
      icon: "🖼",
    },
  ];

  let manifestCache = null;

  function route() {
    return location.hash || "#/";
  }

  function isHome() {
    const h = route();
    return h === "#/" || h === "" || h === "#/collections";
  }

  function isMedia() {
    return route().includes("/media");
  }

  function isEditor() {
    return route().includes("/entries/");
  }

  function removeEl(id) {
    document.getElementById(id)?.remove();
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
      <nav class="chaos-admin-shell__nav" aria-label="Quick links">
        <a href="#/">Dashboard</a>
        <a href="${SITE}/" target="_blank" rel="noopener">View site</a>
      </nav>
    `;
    document.body.prepend(shell);
    loadSyncBadge(shell.querySelector("[data-sync-badge]"));
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

  function injectDashboard() {
    if (!isHome()) {
      removeEl(DASHBOARD_ID);
      document.body.classList.remove("chaos-route-home");
      return;
    }
    document.body.classList.add("chaos-route-home");
    if (document.getElementById(DASHBOARD_ID)) return;

    const host =
      document.querySelector('[class*="CollectionMain"]') ||
      document.querySelector('[class*="Main"]') ||
      document.querySelector("main");
    if (!host) return;

    const panel = document.createElement("section");
    panel.id = DASHBOARD_ID;
    panel.className = "chaos-admin-dashboard";
    panel.innerHTML = `
      <div class="chaos-admin-dashboard__hero">
        <h1>What do you want to edit?</h1>
        <p>Choose a section below. When you are done, click <strong>Publish</strong> (top right). Changes save to GitHub and the live site updates in about 2 minutes.</p>
        <ol class="chaos-admin-dashboard__steps">
          <li>Open a section</li>
          <li>Edit the fields</li>
          <li>Click <strong>Publish</strong></li>
          <li>Wait for deploy, then refresh the site</li>
        </ol>
      </div>
      <div class="chaos-admin-dashboard__grid">
        ${SECTIONS.map(
          (s) => `
          <a class="chaos-admin-card" href="${s.hash}">
            <span class="chaos-admin-card__step">${s.step}</span>
            <span class="chaos-admin-card__icon" aria-hidden="true">${s.icon}</span>
            <strong>${s.title}</strong>
            <span>${s.desc}</span>
          </a>`,
        ).join("")}
      </div>
      <aside class="chaos-admin-dashboard__note">
        <strong>Tip:</strong> Carousel images live in folders (one folder per post ID). Use <strong>Pictures</strong> to see all images, not only the small Media grid.
      </aside>
    `;
    host.prepend(panel);
  }

  function injectEditorHelp() {
    document.querySelectorAll(".chaos-editor-help").forEach((n) => n.remove());
    if (!isEditor()) return;

    const toolbar =
      document.querySelector('[class*="ToolbarContainer"]') ||
      document.querySelector('[class*="CollectionTop"]');
    if (!toolbar) return;

    const h = route();
    let text =
      "Edit the fields below, then click Publish. Do not close the tab until you see “Changes saved”.";
    if (h.includes("campaign-posts")) {
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
        if (label.includes("publish") || label.includes("published")) {
          setTimeout(() => {
            if (!document.querySelector(".chaos-publish-toast")) {
              const toast = document.createElement("div");
              toast.className = "chaos-publish-toast";
              toast.setAttribute("role", "status");
              toast.innerHTML =
                "<strong>Saved to GitHub.</strong> The live site updates in ~2 minutes. Hard-refresh the portfolio if you do not see changes.";
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 8000);
            }
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

  function refresh() {
    injectShell();
    injectDashboard();
    injectEditorHelp();
    injectMediaBrowser();
  }

  function boot() {
    injectPublishReminder();
    refresh();
    window.addEventListener("hashchange", refresh);
    const obs = new MutationObserver(() => refresh());
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
