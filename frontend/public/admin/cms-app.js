/**
 * Chaos CMS App — custom dashboard + isolated Decap editor
 * Replaces legacy cms-custom overlay (do not load both).
 */
(function () {
  const SITE = "https://portfolio.chaoticstudio.workers.dev";
  const MANIFEST = "/admin/media-manifest.json";
  const SYNC_URL = "/admin/sync-status.json";

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
  };

  const EDITORS = [
    {
      id: "campaign-posts",
      title: "All social posts",
      desc: "Edit every campaign card, tags, slides, and visibility. Large file — allow time to load.",
      hash: "#/collections/campaign/entries/campaign-posts",
      icon: "grid",
      hero: true,
      hint: "Each post needs a Post ID matching its image folder. Use Publish when finished.",
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
  let lastDockKey = "";

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
    return EDITORS.some((e) => h.startsWith(e.hash));
  }

  function goToPortal() {
    const target = `${location.pathname}${location.search}#/`;
    if (route() !== "#/") history.replaceState(null, "", target);
    forcePortalView("dashboard");
  }

  function ensureDecapStash() {
    let stash = document.getElementById("chaos-decap-stash");
    if (!stash) {
      stash = document.createElement("div");
      stash.id = "chaos-decap-stash";
      stash.setAttribute("aria-hidden", "true");
      document.body.appendChild(stash);
    }
    return stash;
  }

  function stashDecap() {
    const nc = document.getElementById("nc-root");
    if (!nc) return;
    const stash = ensureDecapStash();
    if (nc.parentElement !== stash) stash.appendChild(nc);
  }

  function forcePortalView(viewMode) {
    document.body.className = `chaos-mode-${viewMode}`;
    document.querySelectorAll(".chaos-view").forEach((v) => {
      v.classList.toggle("is-active", v.id === `chaos-view-${viewMode}`);
    });
    document.querySelectorAll("[data-nav]").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("data-nav") === viewMode);
    });
    const bar = document.querySelector("[data-editor-bar]");
    if (bar) bar.replaceChildren();
    setEditorLoading(false);
    lastDockKey = "";
    stashDecap();
    if (viewMode === "dashboard") renderDashboard();
    if (viewMode === "media") renderMedia();
    if (viewMode === "assistant") renderAssistantView();
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
        </div>
        <nav class="chaos-app-header__nav" aria-label="Main">
          <a href="#/" data-nav="dashboard">${icon("home")}<span class="chaos-nav-label">Home</span></a>
          <a href="#/media" data-nav="media">${icon("image")}<span class="chaos-nav-label">Media</span></a>
          <a href="#/assistant" data-nav="assistant">${icon("chat")}<span class="chaos-nav-label">AI</span></a>
          <a href="${SITE}/" target="_blank" rel="noopener">${icon("external")}<span class="chaos-nav-label">Site</span></a>
        </nav>
      </header>
      <main class="chaos-app-main">
        <div id="chaos-view-dashboard" class="chaos-view chaos-dash"></div>
        <div id="chaos-view-media" class="chaos-view chaos-media-view"></div>
        <div id="chaos-view-assistant" class="chaos-view chaos-assistant-view"></div>
        <div id="chaos-view-editor" class="chaos-view chaos-editor-view">
          <div class="chaos-editor-bar" data-editor-bar></div>
          <p class="chaos-editor-loading" data-editor-loading hidden>Loading editor… large files may take a moment.</p>
          <div id="chaos-decap-mount" class="chaos-decap-mount"></div>
        </div>
      </main>
      <footer class="chaos-dock" data-save-dock role="toolbar" aria-label="Publish"></footer>
    `;
    document.body.prepend(app);

    loadSyncBadge();
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
      if (p.ok) stats.posts = (await p.json()).socialPosts?.items?.length ?? 0;
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
        <span class="chaos-card__cta">Open AI ${ICONS.chevron}</span>
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
    const mount = document.getElementById("chaos-decap-mount");
    const nc = document.getElementById("nc-root");
    if (!mount || !nc) return;
    if (nc.parentElement !== mount) mount.appendChild(nc);
  }

  function setEditorLoading(show) {
    const el = document.querySelector("[data-editor-loading]");
    if (el) el.hidden = !show;
  }

  function dockSignature(buttons) {
    return buttons.map((b) => `${(b.textContent || "").trim()}|${b.disabled}`).join(";");
  }

  function mutationInChrome(node) {
    if (!(node instanceof Node)) return false;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el || !(el instanceof Element)) return false;
    return Boolean(el.closest("[data-save-dock], .chaos-toast, [data-editor-loading]"));
  }

  function renderEditorBar() {
    const bar = document.querySelector("[data-editor-bar]");
    const ed = editorFromHash();
    if (!bar || !ed) return;
    bar.innerHTML = `
      <button type="button" class="chaos-editor-bar__back" data-portal-back>${icon("home")} Back to portal</button>
      <span class="chaos-editor-bar__title">${ed.title}</span>
      <p class="chaos-editor-bar__hint">${ed.hint || "Edit fields below, then Publish."}</p>
    `;
    bar.querySelector("[data-portal-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      goToPortal();
    });
  }

  function bindPortalNavigation() {
    if (window.__chaosPortalNav) return;
    window.__chaosPortalNav = true;
    document.body.addEventListener("click", (e) => {
      const t = e.target instanceof Element ? e.target.closest("[data-portal-back], [data-nav='dashboard']") : null;
      if (!t) return;
      if (t.matches("[data-nav='dashboard']") && route() === "#/") return;
      if (t.matches("[data-nav='dashboard']")) {
        e.preventDefault();
        goToPortal();
      }
    });
  }

  function findToolbarButtons() {
    const toolbar =
      document.querySelector('[class*="ToolbarContainer"]') ||
      document.querySelector('[class*="EditorControlBar"]');
    if (!toolbar) return [];
    return [...toolbar.querySelectorAll("button")].filter((btn) => {
      const t = (btn.textContent || "").toLowerCase();
      return /publish|save|delete|status|draft/.test(t);
    });
  }

  function appendDockBack(dock) {
    const back = document.createElement("button");
    back.type = "button";
    back.className = "chaos-dock__btn chaos-dock__btn--back";
    back.setAttribute("data-portal-back", "");
    back.textContent = "← Portal";
    dock.appendChild(back);
  }

  function renderSaveDock(force) {
    const dock = document.querySelector("[data-save-dock]");
    const ed = editorFromHash();
    if (!dock || !ed) return;

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
      wait.textContent = "Loading editor…";
      dock.appendChild(wait);
      setEditorLoading(true);
      lastDockKey = "";
      return;
    }

    setEditorLoading(false);
    lastDockKey = sig;

    for (const btn of buttons) {
      const text = (btn.textContent || "").trim();
      const lower = text.toLowerCase();
      const action = document.createElement("button");
      action.type = "button";
      action.className = "chaos-dock__btn";
      action.textContent = text;
      action.disabled = btn.disabled;
      if (/publish|save/.test(lower)) action.classList.add("chaos-dock__btn--primary");
      if (/delete/.test(lower)) action.classList.add("chaos-dock__btn--danger");
      action.addEventListener("click", () => {
        if (/publish|save/.test(lower)) {
          action.disabled = true;
          action.textContent = /publish/.test(lower) ? "Publishing…" : "Saving…";
        }
        btn.click();
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

  function applyMode() {
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

    if (m === "dashboard") renderDashboard();
    if (m === "media") renderMedia();
    if (m === "assistant") {
      stashDecap();
      renderAssistantView();
    }
    if (m === "editor") {
      lastDockKey = "";
      setEditorLoading(true);
      mountDecap();
      renderEditorBar();
      document.getElementById("chaos-app")?.classList.add("chaos-app--editing");
      renderSaveDock(true);
      clearTimeout(dockTimer);
      dockTimer = setTimeout(() => renderSaveDock(true), 1200);
      dockTimer = setTimeout(() => renderSaveDock(true), 4000);
    } else {
      setEditorLoading(false);
      document.getElementById("chaos-app")?.classList.remove("chaos-app--editing");
      stashDecap();
    }
  }

  function watchHashGuard() {
    let last = route();
    const tick = () => {
      const h = route();
      if (h !== last) {
        last = h;
        applyMode();
        return;
      }
      if (isStrayDecapRoute() && document.body.classList.contains("chaos-mode-editor")) {
        goToPortal();
      }
    };
    window.addEventListener("hashchange", () => {
      last = route();
      applyMode();
    });
    window.addEventListener("popstate", tick);
    setInterval(tick, 400);
  }

  function normalizeListValue(val, prop) {
    if (!Array.isArray(val)) return val;
    return val.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && prop in item) return String(item[prop]);
      return String(item ?? "");
    });
  }

  function normalizeEntry(entry) {
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
    if (window.__chaosAppHooks || !window.CMS?.registerEventListener) return;
    window.__chaosAppHooks = true;
    // Decap 3.x: preSave/postSave only (no preLoad). Normalize list shapes on save.
    try {
      window.CMS.registerEventListener({
        name: "preSave",
        handler: ({ entry }) => {
          if (!entry?.get) return entry;
          const data = entry.get("data");
          if (!data?.toJS) return entry;
          const plain = data.toJS();
          normalizeEntry({ data: plain });
          const Map = data.constructor;
          if (Map?.fromJS) return entry.set("data", Map.fromJS(plain));
          return entry;
        },
      });
    } catch (e) {
      console.warn("[CMS] preSave hook skipped", e);
    }
  }

  function bindPublishToast() {
    if (window.__chaosPublishToast) return;
    window.__chaosPublishToast = true;
    document.body.addEventListener(
      "click",
      (e) => {
        const btn = e.target instanceof HTMLElement ? e.target.closest("button") : null;
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
      obs.observe(document.body, { childList: true, subtree: false });
    };
    mount();
    window.addEventListener("load", () => {
      obs.disconnect();
      mount();
    });
  }

  const CMS_TOKEN_CACHE = "chaos_cms_github_token";

  function cacheCmsGithubToken(token) {
    if (token && typeof token === "string") {
      sessionStorage.setItem(CMS_TOKEN_CACHE, token);
    }
  }

  function syncDecapGithubToken() {
    try {
      const raw = localStorage.getItem("decap-cms-user");
      if (!raw) return;
      const user = JSON.parse(raw);
      if (user?.token) cacheCmsGithubToken(user.token);
    } catch {
      /* ignore */
    }
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
        if (payload?.token) cacheCmsGithubToken(payload.token);
      } catch {
        /* ignore */
      }
    });
    syncDecapGithubToken();
    setInterval(syncDecapGithubToken, 8000);
  }

  function boot() {
    buildShell();
    applyMode();
    bindPublishToast();
    bindPortalNavigation();
    bindCmsOAuthTokenCache();
    registerCmsHooks();
    watchDecapMount();
    watchHashGuard();

    window.addEventListener("load", () => {
      registerCmsHooks();
      syncDecapGithubToken();
      applyMode();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" }).catch(() => {});
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
