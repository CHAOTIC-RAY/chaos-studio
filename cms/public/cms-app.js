/**
 * Chaos CMS App — custom dashboard + isolated Decap editor
 * Replaces legacy cms-custom overlay (do not load both).
 */
(function () {
  const SITE = "https://portfolio.chaoticstudio.workers.dev";
  const MANIFEST = "/media-manifest.json";
  const SYNC_URL = "/sync-status.json";

  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="13" width="7" height="7" rx="1"/><rect x="14" y="13" width="7" height="7" rx="1"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3z"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="m21 15-5-5L5 19"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    external: '<svg viewBox="0 0 24 24"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v7H3V3h7"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    logout: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
  };

  const EDITORS = [
    {
      id: "social-posts",
      title: "Portfolio feed",
      desc: "Social and campaign cards on the home page.",
      hash: "#/collections/campaign/entries/social-posts",
      icon: "grid",
      hero: true,
      hint: "Client posts for the main site feed. Publish when done.",
    },
    {
      id: "gallery-posts",
      title: "Gallery posts",
      desc: "Reels, media kits, posters, and multi-slide work for /gallery.",
      hash: "#/collections/campaign/entries/gallery-posts",
      icon: "image",
      hero: true,
      hint: "Tiles in the panoramic gallery. Feed posts also appear unless listed here.",
    },
    {
      id: "campaign-meta",
      title: "Campaign heading",
      desc: "Subtitle under the Campaign section on the home page.",
      hash: "#/collections/campaign/entries/campaign-meta",
      icon: "file",
      hint: "Short line of text above the post feed.",
    },
    {
      id: "studio-page",
      title: "Chaos Studio page",
      desc: "Packages, pricing, services, and studio contact for /studio.",
      hash: "#/collections/chaos-studio/entries/studio-page",
      icon: "star",
      hint: "This is the Studio tab — not the main portfolio home.",
    },
    {
      id: "main",
      title: "Home page text",
      desc: "Profile, experience, skills, education, and contact.",
      hash: "#/collections/portfolio/entries/main",
      icon: "home",
      hint: "Main portfolio content only.",
    },
    {
      id: "site-config",
      title: "SEO & project cards",
      desc: "Browser title, work thumbnails, and client logos.",
      hash: "#/collections/site/entries/site-config",
      icon: "search",
      hint: "Expand sections carefully — do not delete unknown fields.",
    },
  ];

  const LABELS = Object.fromEntries(EDITORS.map((e) => [e.id, e.title]));

  let manifestCache = null;
  let dockTimer = null;
  let chromeTimer = null;
  let dockPollTimer = null;
  let dockPollAttempts = 0;
  let lastDockKey = "";
  let applyingMode = false;

  function icon(name, size) {
    const cls = size === "sm" ? "chaos-icon chaos-icon--sm" : "chaos-icon";
    return `<span class="${cls}" aria-hidden="true">${ICONS[name] || ""}</span>`;
  }

  function route() {
    return location.hash || "#/";
  }

  function editorFromHash() {
    const m = route().match(/entries\/([^/?#]+)/);
    return m ? EDITORS.find((e) => e.id === m[1]) || null : null;
  }

  function mode() {
    const h = route();
    if (h.includes("/assistant") || h === "#/assistant") return "assistant";
    if (h.includes("/media")) return "media";
    if (editorFromHash()) return "editor";
    return "dashboard";
  }

  function isStrayDecapRoute() {
    const h = route();
    if (!h || h === "#" || h === "#/" || h === "#/collections") return true;
    // Decap collection picker / folder views (not a direct entry editor)
    if (/^#\/collections\/[^/]+(\/new)?$/.test(h)) return true;
    if (/^#\/collections\/[^/]+\/entries$/.test(h)) return true;
    return false;
  }

  function isKnownEditorRoute() {
    const h = route();
    return EDITORS.some((e) => h === e.hash || h.startsWith(`${e.hash}/`));
  }

  function syncDecapEditorRoute() {
    const ed = editorFromHash();
    if (!ed) return;
    const target = ed.hash;
    if (location.hash !== target) {
      location.hash = target;
      return;
    }
    // Hash already matches — nudge Decap layout only. Do not dispatch hashchange:
    // watchHashGuard listens for that and calls applyMode(), which recurses forever.
    nudgeDecapLayout();
  }

  function postLoginView() {
    if (editorFromHash()) {
      forcePortalView("editor");
      syncDecapEditorRoute();
    } else {
      forcePortalView("dashboard");
    }
  }

  function goToPortal() {
    if (window.__chaosPortalRedirect) return;
    const h = route();
    const leavingLogin = document.body.classList.contains("chaos-mode-login");
    if (h === "#/" && mode() === "dashboard" && !leavingLogin) return;
    window.__chaosPortalRedirect = true;
    const target = `${location.pathname}${location.search}#/`;
    if (h !== "#/") history.replaceState(null, "", target);
    forcePortalView("dashboard");
    ensureDecapMounted();
    setTimeout(() => {
      window.__chaosPortalRedirect = false;
    }, 300);
  }

  function ensureDecapMounted() {
    const mount = document.getElementById("chaos-decap-mount");
    const nc = document.getElementById("nc-root");
    if (!mount || !nc) return false;
    if (nc.parentElement !== mount) mount.appendChild(nc);

    const m = mode();
    const slot = document.querySelector("[data-decap-slot]");

    if (m === "editor" && slot) {
      if (mount.parentElement !== slot) slot.appendChild(mount);
    } else if (mount.parentElement !== document.body) {
      document.body.appendChild(mount);
    }
    mount.style.removeProperty("display");
    return true;
  }

  function updateEditorContext() {
    const el = document.querySelector("[data-editor-title]");
    const ed = editorFromHash();
    if (!el) return;
    if (mode() === "editor" && ed) {
      el.textContent = ed.title;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  function waitForDecapRoot() {
    if (ensureDecapMounted()) return;
    const obs = new MutationObserver(() => {
      if (ensureDecapMounted()) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function nudgeDecapLayout() {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }

  function forcePortalView(viewMode) {
    document.body.className = `chaos-mode-${viewMode}`;
    document.querySelectorAll(".chaos-view").forEach((v) => {
      v.classList.toggle("is-active", v.id === `chaos-view-${viewMode}`);
    });
    document.querySelectorAll("[data-nav]").forEach((a) => {
      a.hidden = false;
      a.classList.toggle("is-active", a.getAttribute("data-nav") === viewMode);
    });
    setEditorLoading(false);
    lastDockKey = "";
    if (viewMode === "dashboard") renderDashboard();
    if (viewMode === "media") renderMedia();
    if (viewMode === "assistant") renderAssistantView();
    if (viewMode !== "editor") ensureDecapMounted();
  }

  const AI_UI_VERSION = "15";

  function renderAssistantView() {
    const el = document.getElementById("chaos-view-assistant");
    if (!el || !window.ChaosAssistant) return;
    if (!el.dataset.mounted || el.dataset.uiVersion !== AI_UI_VERSION) {
      window.ChaosAssistant.renderAssistant(el);
      el.dataset.mounted = "1";
      el.dataset.uiVersion = AI_UI_VERSION;
    }
  }

  function buildShell() {
    if (document.getElementById("chaos-app")) return;

    const app = document.createElement("div");
    app.id = "chaos-app";
    app.innerHTML = `
      <header class="chaos-app-header">
        <div class="chaos-app-header__brand">
          <img src="/icons/icon-192.png" width="36" height="36" alt="" />
          <div>
            <strong>Chaos Studio CMS</strong>
            <span data-sync-badge>Checking sync…</span>
          </div>
          <span class="chaos-app-header__context" data-editor-title hidden></span>
        </div>
        <nav class="chaos-app-header__nav" aria-label="Main">
          <a href="#/" data-nav="dashboard">${icon("home")}<span class="chaos-nav-label">Dashboard</span></a>
          <a href="#/media" data-nav="media">${icon("image")}<span class="chaos-nav-label">Media</span></a>
          <a href="#/assistant" data-nav="assistant">${icon("chat")}<span class="chaos-nav-label">AI</span></a>
          <a href="${SITE}/" target="_blank" rel="noopener">${icon("external")}<span class="chaos-nav-label">Site</span></a>
          <button type="button" class="chaos-logout" data-portal-logout hidden title="Log out of GitHub">${icon("logout")}<span class="chaos-nav-label">Log out</span></button>
        </nav>
      </header>
      <main class="chaos-app-main">
        <div id="chaos-view-login" class="chaos-view chaos-login-view">
          <div class="chaos-login-slot" data-login-slot></div>
        </div>
        <div id="chaos-view-dashboard" class="chaos-view chaos-dash"></div>
        <div id="chaos-view-media" class="chaos-view chaos-media-view"></div>
        <div id="chaos-view-assistant" class="chaos-view chaos-assistant-view"></div>
        <div id="chaos-view-editor" class="chaos-view chaos-editor-view">
          <p class="chaos-editor-loading" data-editor-loading hidden>Loading editor… large files may take a moment.</p>
          <div class="chaos-decap-slot" data-decap-slot></div>
        </div>
      </main>
      <footer class="chaos-dock" data-save-dock role="toolbar" aria-label="Publish"></footer>
    `;
    document.body.prepend(app);
    ensureDecapMounted();

    loadSyncBadge();
    lastLoginState = isLoggedIn();
    updateLogoutButton();
  }

  async function loadSyncBadge() {
    const el = document.querySelector("[data-sync-badge]");
    if (!el) return;
    try {
      const res = await fetch(SYNC_URL, { cache: "no-store" });
      const data = await res.json();
      const ok = data.ok && data.mirrors?.every((m) => m.inSync);
      el.textContent = ok ? "In sync with GitHub" : "Sync pending on deploy";
      el.classList.toggle("is-ok", ok);
    } catch {
      el.textContent = "Publish saves to GitHub";
      el.classList.add("is-ok");
    }
  }

  async function fetchStats() {
    const stats = { posts: 0, images: 0, sections: EDITORS.length };
    try {
      const [p, m] = await Promise.all([
        fetch(`${SITE}/api/portfolio`, { cache: "no-store" }),
        fetch(MANIFEST, { cache: "no-store" }),
      ]);
      if (p.ok) {
        const data = await p.json();
        stats.posts =
          (data.socialPosts?.items?.length ?? 0) + (data.galleryPosts?.items?.length ?? 0);
      }
      if (m.ok) stats.images = (await m.json()).files?.length ?? 0;
    } catch {
      /* ignore */
    }
    return stats;
  }

  function renderDashboard() {
    const el = document.getElementById("chaos-view-dashboard");
    if (!el) return;

    const cards = EDITORS.map((e) => {
      const cls = e.hero ? "chaos-card chaos-card--hero" : "chaos-card";
      return `
        <a class="${cls}" href="${e.hash}">
          ${icon(e.icon)}
          <strong>${e.title}</strong>
          <span>${e.desc}</span>
          <span class="chaos-card__cta">Open editor ${icon("chevron", "sm")}</span>
        </a>`;
    }).join("");

    el.innerHTML = `
      <h1 class="chaos-dash__title">Content portal</h1>
      <p class="chaos-dash__lead">Pick what to edit. You never need Decap’s old collection screens — each card opens the editor directly.</p>
      <div data-kpis class="chaos-kpis"><div class="chaos-kpi"><span class="chaos-kpi__n">…</span><span class="chaos-kpi__l">Loading</span></div></div>
      <a class="chaos-card chaos-card--ai" href="#/assistant">
        ${icon("chat")}
        <strong>AI site assistant</strong>
        <span>Free Gemini AI with image uploads — attach files and apply site changes to GitHub.</span>
        <span class="chaos-card__cta">Open AI ${icon("chevron", "sm")}</span>
      </a>
      <div class="chaos-grid">${cards}</div>
      <p class="chaos-dash__note"><strong>Publish</strong> saves to GitHub. The live site updates in about two minutes after deploy.</p>
    `;

    fetchStats().then((s) => {
      const host = el.querySelector("[data-kpis]");
      if (!host) return;
      host.innerHTML = `
        <div class="chaos-kpi"><span class="chaos-kpi__n">${s.posts}</span><span class="chaos-kpi__l">Posts</span></div>
        <div class="chaos-kpi"><span class="chaos-kpi__n">${s.images}</span><span class="chaos-kpi__l">Images</span></div>
        <div class="chaos-kpi"><span class="chaos-kpi__n">${s.sections}</span><span class="chaos-kpi__l">Sections</span></div>
      `;
    });
  }

  async function loadManifest() {
    if (manifestCache) return manifestCache;
    const res = await fetch(MANIFEST, { cache: "no-store" });
    manifestCache = res.ok ? await res.json() : { files: [], folders: [] };
    return manifestCache;
  }

  function renderMedia() {
    const el = document.getElementById("chaos-view-media");
    if (!el) return;
    el.innerHTML = `
      <h2>Media library</h2>
      <p class="chaos-dash__lead">All post images including carousel folders. Click to copy a slide name for Social posts.</p>
      <div class="chaos-media-tools">
        <input type="search" data-media-q placeholder="Search images…" aria-label="Search" />
        <select data-media-folder aria-label="Folder"><option value="all">All folders</option></select>
      </div>
      <div data-media-grid class="chaos-media-grid"><p>Loading…</p></div>
    `;

    const q = el.querySelector("[data-media-q]");
    const folder = el.querySelector("[data-media-folder]");
    const grid = el.querySelector("[data-media-grid]");

    loadManifest().then((data) => {
      for (const f of data.folders || []) {
        const o = document.createElement("option");
        o.value = f;
        o.textContent = f;
        folder.appendChild(o);
      }
      const paint = () => {
        const query = (q.value || "").trim().toLowerCase();
        const fold = folder.value;
        const files = (data.files || []).filter((file) => {
          if (fold && fold !== "all" && file.folder !== fold) return false;
          if (!query) return true;
          return file.path.toLowerCase().includes(query);
        });
        if (!files.length) {
          grid.innerHTML = "<p>No images match.</p>";
          return;
        }
        grid.innerHTML = files
          .map((file) => {
            const copy = file.slideBasename || file.name.replace(/\.[^.]+$/, "");
            return `
              <button type="button" class="chaos-media-tile" data-copy="${copy.replace(/"/g, "&quot;")}">
                <img src="${SITE}${file.url}" alt="" loading="lazy" />
                <small>${file.folder}/${file.name}</small>
              </button>`;
          })
          .join("");
        grid.querySelectorAll(".chaos-media-tile").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const text = btn.getAttribute("data-copy") || "";
            try {
              await navigator.clipboard.writeText(text);
              btn.style.borderColor = "var(--app-cta)";
            } catch {
              window.prompt("Copy:", text);
            }
          });
        });
      };
      q.addEventListener("input", paint);
      folder.addEventListener("change", paint);
      paint();
    });
  }

  function mountDecap() {
    ensureDecapMounted();
    nudgeDecapLayout();
  }

  function setEditorLoading(show) {
    const el = document.querySelector("[data-editor-loading]");
    if (el) el.hidden = !show;
  }

  function dockSignature(controls) {
    return controls
      .map((c) => `${controlLabel(c)}|${controlDisabled(c)}|${c.getAttribute("role") || "button"}`)
      .join(";");
  }

  function controlLabel(el) {
    return (el.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
  }

  function controlDisabled(el) {
    if (!el) return true;
    if ("disabled" in el && el.disabled) return true;
    return el.getAttribute("aria-disabled") === "true";
  }

  function toolbarActionText(el) {
    return controlLabel(el).toLowerCase();
  }

  function isEditorWidgetControl(el) {
    if (!(el instanceof Element)) return false;
    if (el.closest("[data-save-dock], .chaos-toast, [data-editor-loading]")) return true;
    if (el.closest('[data-testid^="list-item"], [class*="ListItem"], [class*="ListControl"]')) {
      return !el.closest('[class*="ToolbarContainer"], [class*="ToolbarDropdown"]');
    }
    if (el.closest('[class*="ObjectControl"], [class*="WidgetHeader"], [class*="CollapseButton"]')) {
      return !el.closest('[class*="ToolbarContainer"], [class*="ToolbarDropdown"]');
    }
    return false;
  }

  function isToolbarAction(el) {
    if (!(el instanceof Element)) return false;
    if (isEditorWidgetControl(el)) return false;
    const t = toolbarActionText(el);
    if (!t) return false;
    return (
      /^(publish(ed|ing)?|save|saving|delete|deleting|status|draft|ready|published|unpublish)/.test(t) ||
      /\b(publish now|publish changes|save changes|delete entry|delete published|delete unpublished|unpublish|duplicate)\b/.test(
        t,
      )
    );
  }

  function toolbarScopes(root) {
    const scoped = [
      ...root.querySelectorAll('[class*="ToolbarContainer"], [class*="ToolbarDropdown"]'),
    ];
    return scoped.length ? scoped : [root];
  }

  function mutationInChrome(node) {
    if (!(node instanceof Node)) return false;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el || !(el instanceof Element)) return false;
    return Boolean(el.closest("[data-save-dock], .chaos-toast, [data-editor-loading]"));
  }

  function triggerDecapButton(btn) {
    if (!btn) return;
    btn.focus();
    btn.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
    );
    if (typeof btn.click === "function") btn.click();
  }

  function findDropdownMenuItem(trigger, preferred) {
    const menuItems = [
      ...document.querySelectorAll('#nc-root [role="menuitem"], #nc-root [class*="DropdownItem"]'),
    ];
    if (!menuItems.length) return null;
    if (preferred) {
      const hit = menuItems.find((item) => preferred.test(toolbarActionText(item)));
      if (hit) return hit;
    }
    const triggerText = toolbarActionText(trigger);
    if (/^publish/.test(triggerText)) {
      return (
        menuItems.find((item) => /\bpublish now\b/.test(toolbarActionText(item))) || menuItems[0]
      );
    }
    if (/^save|^status|^draft/.test(triggerText)) return menuItems[0];
    return null;
  }

  function triggerDecapControl(control, options) {
    if (!control) return;
    const preferred = options?.menuMatch;
    const isDropdown =
      control.getAttribute("role") === "button" && control.getAttribute("aria-haspopup") === "true";

    triggerDecapButton(control);
    if (!isDropdown) return;

    window.setTimeout(() => {
      const item = findDropdownMenuItem(control, preferred);
      if (item) triggerDecapButton(item);
    }, 140);
  }

  function findToolbarButtons() {
    const root = document.getElementById("nc-root");
    if (!root) return [];
    const scopes = toolbarScopes(root);
    const candidates = scopes.flatMap((scope) => [
      ...scope.querySelectorAll("button"),
      ...scope.querySelectorAll('[role="button"]'),
    ]);
    const seen = new Set();
    const matches = [];
    for (const el of candidates) {
      if (seen.has(el) || el.closest("[data-save-dock]")) continue;
      if (!isToolbarAction(el)) continue;
      seen.add(el);
      matches.push(el);
    }
    return matches;
  }

  function stopDockPoll() {
    clearTimeout(dockPollTimer);
    dockPollAttempts = 0;
  }

  function scheduleDockPoll(force) {
    if (mode() !== "editor") {
      stopDockPoll();
      return;
    }
    clearTimeout(dockPollTimer);
    if (force) dockPollAttempts = 0;
    const buttons = findToolbarButtons();
    if (buttons.length) {
      stopDockPoll();
      renderSaveDock(true);
      return;
    }
    if (dockPollAttempts >= 40) {
      renderSaveDock(true);
      return;
    }
    dockPollAttempts += 1;
    dockPollTimer = setTimeout(() => {
      renderSaveDock(true);
      scheduleDockPoll(false);
    }, 500);
  }

  function bindPortalNavigation() {
    if (window.__chaosPortalNav) return;
    window.__chaosPortalNav = true;
    document.body.addEventListener("click", (e) => {
      const t = e.target instanceof Element ? e.target.closest("[data-portal-back], [data-nav='dashboard']") : null;
      if (!t) return;
      if (t.matches("[data-portal-back]")) {
        e.preventDefault();
        goToPortal();
        return;
      }
      if (t.matches("[data-nav='dashboard']") && route() === "#/") return;
      if (t.matches("[data-nav='dashboard']")) {
        e.preventDefault();
        goToPortal();
      }
    });
  }

  function appendDockBack(dock) {
    const back = document.createElement("button");
    back.type = "button";
    back.className = "chaos-dock__btn chaos-dock__btn--back";
    back.setAttribute("data-portal-back", "");
    back.textContent = "← Home";
    back.addEventListener("click", (e) => {
      e.preventDefault();
      goToPortal();
    });
    dock.appendChild(back);
  }

  function isDecapLoginScreen() {
    return Boolean(document.querySelector('#nc-root [class*="AuthenticationPage"]'));
  }

  function editorFieldsReady() {
    return document.querySelectorAll("#nc-root input, #nc-root textarea, #nc-root select").length > 0;
  }

  function renderSaveDock(force) {
    const dock = document.querySelector("[data-save-dock]");
    const ed = editorFromHash();
    if (!dock || !ed) return;

    if (isDecapLoginScreen()) {
      dock.replaceChildren();
      appendDockBack(dock);
      const label = document.createElement("span");
      label.className = "chaos-dock__label";
      label.textContent = "Sign in with GitHub to load this editor";
      dock.appendChild(label);
      setEditorLoading(false);
      lastDockKey = "login";
      return;
    }

    const buttons = findToolbarButtons();
    const sig = dockSignature(buttons);

    if (!force && sig && sig === lastDockKey) return;

    dock.replaceChildren();
    appendDockBack(dock);
    const label = document.createElement("span");
    label.className = "chaos-dock__label";
    label.textContent = ed.title;
    dock.appendChild(label);

    if (!buttons.length) {
      const wait = document.createElement("span");
      wait.className = "chaos-dock__label";
      wait.textContent = editorFieldsReady() ? "Preparing publish actions…" : "Loading editor…";
      dock.appendChild(wait);
      setEditorLoading(!editorFieldsReady());
      lastDockKey = "";
      if (editorFieldsReady()) scheduleDockPoll(true);
      return;
    }

    stopDockPoll();
    setEditorLoading(false);
    lastDockKey = sig;

    for (const btn of buttons) {
      const text = controlLabel(btn);
      const lower = text.toLowerCase();
      const action = document.createElement("button");
      action.type = "button";
      action.className = "chaos-dock__btn";
      action.textContent = text;
      action.disabled = controlDisabled(btn);
      if (/publish|save/.test(lower)) action.classList.add("chaos-dock__btn--primary");
      if (/delete/.test(lower)) action.classList.add("chaos-dock__btn--danger");
      if (/^published$/.test(lower.trim()) && controlDisabled(btn)) {
        action.disabled = true;
      }
      action.addEventListener("click", () => {
        if (/publish|save/.test(lower)) {
          action.disabled = true;
          action.textContent = /publish/.test(lower) ? "Publishing…" : "Saving…";
        }
        triggerDecapControl(btn, {
          menuMatch: /publish/.test(lower) ? /\bpublish now\b/i : /\bsave\b/i,
        });
        setTimeout(() => renderSaveDock(true), 2000);
      });
      dock.appendChild(action);
    }
  }

  function scheduleEditorChrome() {
    if (mode() !== "editor") return;
    clearTimeout(chromeTimer);
    chromeTimer = setTimeout(() => {
      mountDecap();
      renderSaveDock();
    }, 280);
  }

  function showToast(msg) {
    document.querySelector(".chaos-toast")?.remove();
    const t = document.createElement("div");
    t.className = "chaos-toast";
    t.setAttribute("role", "status");
    t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 8000);
  }

  function applyLoginMode() {
    document.body.className = "chaos-mode-login";
    document.querySelectorAll(".chaos-view").forEach((v) => {
      v.classList.toggle("is-active", v.id === "chaos-view-login");
    });
    document.querySelectorAll("[data-nav]").forEach((a) => {
      a.hidden = true;
    });
    document.getElementById("chaos-app")?.classList.remove("chaos-app--editing");
    setEditorLoading(false);
    ensureDecapMounted();
    updateLogoutButton();
    nudgeDecapLayout();
  }

  function applyMode() {
    if (applyingMode) return;
    applyingMode = true;
    try {
      if (!isLoggedIn()) {
        applyLoginMode();
        return;
      }

      document.querySelectorAll("[data-nav]").forEach((a) => {
        a.hidden = false;
      });

      if (document.body.classList.contains("chaos-mode-login")) {
        postLoginView();
        ensureDecapMounted();
        return;
      }

      if (isStrayDecapRoute() || (route().includes("/collections") && !isKnownEditorRoute())) {
        goToPortal();
        return;
      }

      const m = mode();
      document.body.className = `chaos-mode-${m}`;

      document.querySelectorAll(".chaos-view").forEach((v) => {
        v.classList.toggle("is-active", v.id === `chaos-view-${m}`);
      });

      document.querySelectorAll("[data-nav]").forEach((a) => {
        a.classList.toggle("is-active", a.getAttribute("data-nav") === m);
      });

      updateEditorContext();

      if (m === "dashboard") renderDashboard();
      if (m === "media") renderMedia();
      if (m === "assistant") {
        renderAssistantView();
      }
      if (m === "editor") {
        lastDockKey = "";
        setEditorLoading(true);
        syncDecapEditorRoute();
        ensureDecapMounted();
        updateEditorContext();
        document.getElementById("chaos-app")?.classList.add("chaos-app--editing");
        nudgeDecapLayout();
        renderSaveDock(true);
        scheduleDockPoll(true);
        clearTimeout(dockTimer);
        dockTimer = setTimeout(() => {
          ensureDecapMounted();
          nudgeDecapLayout();
          renderSaveDock(true);
        }, 1200);
      } else {
        stopDockPoll();
        setEditorLoading(false);
        ensureDecapMounted();
        document.getElementById("chaos-app")?.classList.remove("chaos-app--editing");
      }
    } finally {
      applyingMode = false;
    }
  }

  function watchHashGuard() {
    window.addEventListener("hashchange", () => applyMode());
    window.addEventListener("popstate", () => applyMode());
  }

  function registerCmsHooks() {
    /* cms-hooks.js registers preSave on each Decap instance (parent + iframe). */
  }

  function bindPublishToast() {
    if (window.__chaosPublishToast) return;
    window.__chaosPublishToast = true;
    document.body.addEventListener(
      "click",
      (e) => {
        const btn = e.target instanceof HTMLElement ? e.target.closest("button, [role='button']") : null;
        if (!btn) return;
        const t = (btn.textContent || "").toLowerCase();
        if (/publish|published|save/.test(t)) {
          setTimeout(() => {
            showToast("<strong>Saved to GitHub.</strong> Live site updates after deploy (~2 min).");
            renderSaveDock();
          }, 500);
        }
      },
      true,
    );
  }

  function watchDecapMount() {
    const obs = new MutationObserver((records) => {
      if (isLoggedIn() && document.body.classList.contains("chaos-mode-login")) {
        applyMode();
      }
      if (!isLoggedIn() && document.querySelector('#nc-root [class*="AuthenticationPage"]')) {
        onAuthChange();
      }
      if (mode() !== "editor") return;
      const relevant = records.some((r) => {
        const nodes = [...(r.addedNodes || []), ...(r.removedNodes || []), r.target];
        return nodes.some((n) => {
          if (mutationInChrome(n)) return false;
          const el = n instanceof Element ? n : n?.parentElement;
          return el?.id === "nc-root" || el?.closest?.("#nc-root");
        });
      });
      if (relevant) scheduleEditorChrome();
    });
    const mount = () => {
      const root = document.getElementById("nc-root");
      if (root) {
        obs.observe(root, { childList: true, subtree: true });
        return;
      }
      obs.observe(document.body, { childList: true, subtree: true });
    };
    mount();
    window.addEventListener("load", () => {
      obs.disconnect();
      mount();
    });
  }

  const CMS_TOKEN_CACHE = "chaos_cms_github_token";
  let lastLoginState = null;

  function getCmsUser() {
    try {
      const raw = localStorage.getItem("decap-cms-user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return Boolean(getCmsUser()?.token);
  }

  function onAuthChange() {
    const loggedIn = isLoggedIn();
    updateLogoutButton();
    if (lastLoginState === loggedIn) return;
    lastLoginState = loggedIn;
    applyMode();
  }

  function updateLogoutButton() {
    const btn = document.querySelector("[data-portal-logout]");
    if (!btn) return;
    const user = getCmsUser();
    const loggedIn = Boolean(user?.token);
    btn.hidden = !loggedIn;
    const name = user?.login || user?.name || "";
    btn.title = name ? `Log out (${name})` : "Log out of GitHub";
  }

  function logoutPortal() {
    const btn = document.querySelector("[data-portal-logout]");
    if (btn instanceof HTMLButtonElement) btn.disabled = true;

    localStorage.removeItem("decap-cms-user");
    sessionStorage.removeItem(CMS_TOKEN_CACHE);

    location.hash = "#/";
    location.reload();
  }

  function bindPortalLogout() {
    if (window.__chaosPortalLogout) return;
    window.__chaosPortalLogout = true;
    document.body.addEventListener("click", (e) => {
      const btn = e.target instanceof Element ? e.target.closest("[data-portal-logout]") : null;
      if (!btn) return;
      e.preventDefault();
      logoutPortal();
    });
  }

  function cacheCmsGithubToken(token) {
    if (token && typeof token === "string") {
      sessionStorage.setItem(CMS_TOKEN_CACHE, token);
    }
  }

  function syncDecapGithubToken() {
    try {
      const raw = localStorage.getItem("decap-cms-user");
      if (!raw) {
        onAuthChange();
        return;
      }
      const user = JSON.parse(raw);
      if (user?.token) cacheCmsGithubToken(user.token);
    } catch {
      /* ignore */
    }
    onAuthChange();
  }

  function persistOAuthUser(payload) {
    if (!payload?.token) return;
    cacheCmsGithubToken(payload.token);
  }

  function pollAuthAfterLogin() {
    let attempts = 0;
    const poll = setInterval(() => {
      attempts += 1;
      const raw = localStorage.getItem("decap-cms-user");
      if (raw) {
        try {
          const user = JSON.parse(raw);
          if (user?.token) {
            cacheCmsGithubToken(user.token);
            onAuthChange();
            clearInterval(poll);
            return;
          }
        } catch {
          /* ignore */
        }
      }
      if (attempts >= 40) clearInterval(poll);
    }, 500);
  }

  function bindCmsOAuthTokenCache() {
    if (window.__chaosCmsOAuthCache) return;
    window.__chaosCmsOAuthCache = true;
    window.addEventListener("message", (e) => {
      if (typeof e.data !== "string") return;
      const okPrefix = "authorization:github:success:";
      if (!e.data.startsWith(okPrefix)) return;
      try {
        const payload = JSON.parse(e.data.slice(okPrefix.length));
        if (payload?.token) {
          console.debug("Decap OAuth token received");
          persistOAuthUser(payload);
          onAuthChange();
          pollAuthAfterLogin();
        }
      } catch (err) {
        console.warn("Failed to parse OAuth payload", err);
      }
    });
    document.body.addEventListener(
      "click",
      (e) => {
        const btn = e.target instanceof Element ? e.target.closest('[class*="LoginButton"]') : null;
        if (!btn) return;
        pollAuthAfterLogin();
      },
      true,
    );
    syncDecapGithubToken();
    setInterval(syncDecapGithubToken, 8000);
  }

  function watchEditorLayout() {
    if (window.__chaosEditorLayout) return;
    window.__chaosEditorLayout = true;
    window.addEventListener("resize", () => {
      if (mode() === "editor") nudgeDecapLayout();
    });
  }

  function boot() {
    buildShell();
    waitForDecapRoot();
    applyMode();
    bindPublishToast();
    bindPortalNavigation();
    bindPortalLogout();
    bindCmsOAuthTokenCache();
    registerCmsHooks();
    watchDecapMount();
    watchHashGuard();
    watchEditorLayout();

    window.addEventListener("load", () => {
      registerCmsHooks();
      syncDecapGithubToken();
      applyMode();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
