(function () {
  "use strict";

  const SYNC_URL = 'https://portfolio.chaoticstudio.workers.dev/api/sync-status';
  const PORTFOLIO_JSON_PATH = 'data/portfolio.json';

  let previewOpen = false;
  let previewDevice = 'desktop';
  let sectionsOpen = false;
  let portfolioData = null;
  let savingVisibility = false;
  let githubToken = null;

  const ICONS = {
    monitor: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    smartphone: '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>',
    tablet: '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    columns: '<svg viewBox="0 0 24 24"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/></svg>',
    layers: '<svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    x: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    desktop: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
  };

  function getToken() {
    if (githubToken) return githubToken;
    const auth = localStorage.getItem('decap-cms-user');
    if (!auth) return null;
    try {
      const parsed = JSON.parse(auth);
      githubToken = parsed.token;
      return githubToken;
    } catch { return null; }
  }

  async function ghGet(path) {
    const tok = getToken();
    if (!tok) return null;
    const res = await fetch(`https://api.github.com/repos/CHAOTIC-RAY/portfolio/contents/${path}`, {
      headers: { 'Authorization': `token ${tok}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      sha: json.sha,
      data: JSON.parse(atob(json.content))
    };
  }

  async function ghPut(path, content, message, sha) {
    const tok = getToken();
    const res = await fetch(`https://api.github.com/repos/CHAOTIC-RAY/portfolio/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: btoa(JSON.stringify(content, null, 2)),
        sha
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `cms-toast cms-toast--${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  function routeLabel() {
    const h = window.location.hash;
    if (h.includes('/collections/portfolio')) return 'Portfolio';
    if (h.includes('/collections/campaign')) return 'Campaign';
    if (h.includes('/collections/chaos-studio')) return 'Chaos Studio';
    return 'Dashboard';
  }

  function previewUrl() {
    const origin = window.location.origin.includes('localhost') ? 'http://localhost:5173' : 'https://chaotic.studio';
    const h = window.location.hash;
    if (h.includes('/collections/chaos-studio')) return `${origin}/studio`;
    if (h.includes('/collections/campaign')) return `${origin}/gallery`;
    return origin;
  }

  // ── UI Construction ───────────────────────────────────────────
  function buildPortal() {
    const layout = document.createElement('div');
    layout.id = 'cms-layout';

    // Move nc-root into editor pane
    const root = document.getElementById('nc-root');
    const editorPane = document.createElement('div');
    editorPane.id = 'cms-editor-pane';
    if (root) {
      root.parentNode.insertBefore(layout, root);
      editorPane.appendChild(root);
    }
    layout.appendChild(editorPane);

    // Bar
    const bar = document.createElement('div');
    bar.id = 'cms-bar';
    bar.innerHTML = `
      <div class="cms-bar__logo">Chaos.</div>
      <div class="cms-bar__context" id="cms-bar-context">${routeLabel()}</div>
      <div class="cms-bar__spacer"></div>
      <div class="cms-bar__sync" id="cms-sync-badge">GitHub</div>
      <button class="cms-bar__btn" id="cms-sections-btn" title="Toggle section visibility">
        ${ICONS['layers']}
        <span>Visibility</span>
      </button>
      <button class="cms-bar__btn" id="cms-split-btn" title="Toggle preview pane">
        ${ICONS['columns']}
      </button>
    `;
    document.body.appendChild(bar);

    // Preview pane
    const previewPane = document.createElement('div');
    previewPane.id = 'cms-preview-pane';
    previewPane.innerHTML = `
      <div class="cms-preview__bar">
        <span class="cms-preview__title">Mockup</span>
        <span class="cms-preview__url" id="cms-preview-url">...</span>
        <div class="cms-bar__group" id="cms-device-group">
          <button class="cms-bar__btn is-active" data-device="desktop">${ICONS['monitor']}</button>
          <button class="cms-bar__btn" data-device="tablet">${ICONS['tablet']}</button>
          <button class="cms-bar__btn" data-device="mobile">${ICONS['smartphone']}</button>
        </div>
        <button class="cms-preview__refresh" id="cms-preview-refresh" title="Refresh frame">${ICONS['refresh']}</button>
      </div>
      <div class="cms-preview__viewport" id="cms-preview-viewport">
        <iframe id="cms-preview-frame"></iframe>
        <div class="cms-preview__highlight" id="cms-preview-hl"></div>
      </div>
    `;
    layout.appendChild(previewPane);

    // Resizer
    const resizer = document.createElement('div');
    resizer.id = 'cms-resizer';
    layout.insertBefore(resizer, previewPane);

    // Sections Panel
    const sectionsPanel = document.createElement('div');
    sectionsPanel.id = 'cms-sections-panel';
    sectionsPanel.innerHTML = `
      <div class="cms-sections__header">
        <span class="cms-sections__title">${ICONS['layers']} Sections</span>
        <button class="cms-sections__close" id="cms-sections-close">${ICONS['x']}</button>
      </div>
      <div class="cms-sections__note">
        Toggle switches save directly to GitHub — site updates after ~2 min deploy.
      </div>
      <div class="cms-sections__list" id="cms-sections-list">
        <div style="padding:1rem;color:var(--c-dim);font-size:0.75rem;">Loading…</div>
      </div>
      <div class="cms-sections__footer">
        <button class="cms-sections__save-btn" id="cms-sections-save" disabled>
          ${ICONS['upload']} Save visibility changes
        </button>
      </div>
    `;
    document.body.appendChild(sectionsPanel);

    bindEvents();
    loadSyncBadge();
  }

  // ── Sync badge ────────────────────────────────────────────────
  async function loadSyncBadge() {
    const el = document.getElementById('cms-sync-badge');
    if (!el) return;
    try {
      const res = await fetch(SYNC_URL, { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        const ok = d.ok && d.mirrors?.every(m => m.inSync);
        el.textContent = ok ? '✓ Synced' : '↻ Deploy pending';
        el.className = `cms-bar__sync${ok ? ' is-ok' : ' is-warn'}`;
      } else {
        el.textContent = 'GitHub';
        el.className = 'cms-bar__sync';
      }
    } catch {
      el.textContent = 'GitHub';
      el.className = 'cms-bar__sync';
    }
  }

  // ── Event bindings ────────────────────────────────────────────
  function bindEvents() {
    document.getElementById('cms-split-btn')?.addEventListener('click', togglePreview);
    document.getElementById('cms-preview-refresh')?.addEventListener('click', refreshPreview);
    document.getElementById('cms-device-group')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-device]');
      if (!btn) return;
      setDevice(btn.dataset.device);
    });
    document.getElementById('cms-sections-btn')?.addEventListener('click', () => toggleSections());
    document.getElementById('cms-sections-close')?.addEventListener('click', () => toggleSections(false));
    document.getElementById('cms-sections-save')?.addEventListener('click', saveSections);

    // Resizer drag
    const resizer = document.getElementById('cms-resizer');
    if (resizer) {
      let dragging = false;
      resizer.addEventListener('mousedown', e => {
        const pane = document.getElementById('cms-preview-pane');
        if (!pane || !previewOpen) return;
        dragging = true;
        resizer.classList.add('is-dragging');
        e.preventDefault();
      });
      document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const pane = document.getElementById('cms-preview-pane');
        const layout = document.getElementById('cms-layout');
        if (!pane || !layout) return;

        const isMobile = window.innerWidth <= 900;
        if (isMobile) {
          const layoutH = layout.getBoundingClientRect().height;
          const rect = layout.getBoundingClientRect();
          const newH = Math.min(Math.max(rect.bottom - e.clientY, 100), layoutH - 100);
          pane.style.flexBasis = `${newH}px`;
        } else {
          const layoutW = layout.getBoundingClientRect().width;
          const rect = layout.getBoundingClientRect();
          const newW = Math.min(Math.max(rect.right - e.clientX, 300), layoutW - 300);
          pane.style.flexBasis = `${newW}px`;
        }
      });
      document.addEventListener('mouseup', () => {
        dragging = false;
        resizer.classList.remove('is-dragging');
      });
    }

    window.addEventListener('hashchange', onRouteChange);
    onRouteChange();
  }

  function onRouteChange() {
    const ctx = document.getElementById('cms-bar-context');
    if (ctx) ctx.textContent = routeLabel();

    if (previewOpen) {
      const frame = document.getElementById('cms-preview-frame');
      const urlEl = document.getElementById('cms-preview-url');
      const url = previewUrl();
      if (frame && frame.src !== url) frame.src = url;
      if (urlEl) urlEl.textContent = url.replace('https://', '');
    }
  }

  function togglePreview(force) {
    previewOpen = typeof force === 'boolean' ? force : !previewOpen;
    const pane = document.getElementById('cms-preview-pane');
    const btn = document.getElementById('cms-split-btn');
    const layout = document.getElementById('cms-layout');
    if (!pane) return;

    pane.classList.toggle('is-open', previewOpen);
    layout?.classList.toggle('has-preview', previewOpen);
    btn?.classList.toggle('is-active', previewOpen);

    if (previewOpen) {
      const frame = document.getElementById('cms-preview-frame');
      const urlEl = document.getElementById('cms-preview-url');
      const url = previewUrl();
      if (frame && frame.src !== url) frame.src = url;
      if (urlEl) urlEl.textContent = url.replace('https://', '');
      setDevice(previewDevice);
    }
  }

  function refreshPreview() {
    const frame = document.getElementById('cms-preview-frame');
    if (!frame) return;
    frame.src = frame.src;
  }

  function setDevice(device) {
    previewDevice = device;
    const viewport = document.getElementById('cms-preview-viewport');
    if (viewport) {
      viewport.className = `cms-preview__viewport${device !== 'desktop' ? ` is-${device}` : ''}`;
    }
    document.querySelectorAll('#cms-device-group [data-device]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.device === device);
    });
  }

  function toggleSections(force) {
    sectionsOpen = typeof force === 'boolean' ? force : !sectionsOpen;
    const panel = document.getElementById('cms-sections-panel');
    if (!panel) return;
    panel.classList.toggle('is-open', sectionsOpen);
    if (sectionsOpen && !portfolioData) loadPortfolioData();
  }

  async function loadPortfolioData() {
    const list = document.getElementById('cms-sections-list');
    if (!list) return;

    const tok = getToken();
    if (!tok) {
      list.innerHTML = `<div style="padding:1rem;color:var(--c-dim);font-size:0.75rem;">Sign in with GitHub first to manage sections.</div>`;
      return;
    }

    list.innerHTML = `<div style="padding:1rem;color:var(--c-dim);font-size:0.75rem;">Loading from GitHub…</div>`;

    const result = await ghGet(PORTFOLIO_JSON_PATH);
    if (!result) {
      list.innerHTML = `<div style="padding:1rem;color:var(--c-red);font-size:0.75rem;">Failed to load portfolio.json</div>`;
      return;
    }

    portfolioData = result;
    renderSectionsList(result.data);
  }

  const SECTION_DEFS = [
    { key: 'sections.showStats',    label: 'Statistics',      sub: 'Portfolio stats grid',    iconName: 'desktop' },
    { key: 'sections.showAwards',   label: 'Awards',           sub: 'Recognition section',     iconName: 'check' },
    { key: 'sections.showNews',     label: 'News & Updates',   sub: 'Latest updates section',  iconName: 'eye' },
    { key: 'clientLogoWall.enabled',label: 'Client Logo Wall', sub: 'Trusted brands row',      iconName: 'layers' },
  ];

  function getNestedVal(obj, dotPath) {
    return dotPath.split('.').reduce((o, k) => o?.[k], obj);
  }

  function renderSectionsList(data) {
    const list = document.getElementById('cms-sections-list');
    if (!list) return;

    list.innerHTML = SECTION_DEFS.map(def => {
      const val = getNestedVal(data, def.key);
      const checked = Boolean(val);
      return `
        <div class="cms-section-row" data-section-key="${def.key}">
          <span class="cms-section-row__icon">${ICONS[def.iconName] || ICONS['eye']}</span>
          <span class="cms-section-row__label">
            ${def.label}
            <span class="cms-section-row__sub">${def.sub}</span>
          </span>
          <label class="cms-toggle" title="Toggle ${def.label}">
            <input type="checkbox" data-section-toggle="${def.key}"${checked ? ' checked' : ''} />
            <span class="cms-toggle__track"></span>
          </label>
        </div>
      `;
    }).join('');

    list.querySelectorAll('[data-section-toggle]').forEach(input => {
      input.addEventListener('change', () => {
        document.getElementById('cms-sections-save').disabled = false;
      });
    });
  }

  async function saveSections() {
    if (savingVisibility || !portfolioData) return;
    const tok = getToken();
    if (!tok) { showToast('Not signed in — sign in with GitHub first', 'error'); return; }

    savingVisibility = true;
    const btn = document.getElementById('cms-sections-save');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    const updated = JSON.parse(JSON.stringify(portfolioData.data));
    document.querySelectorAll('[data-section-toggle]').forEach(input => {
      const parts = input.dataset.sectionToggle.split('.');
      let obj = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = input.checked;
    });

    try {
      await ghPut(PORTFOLIO_JSON_PATH, updated, 'CMS: update section visibility', portfolioData.sha);
      portfolioData.data = updated;
      showToast('✓ Saved to GitHub — site updates after deploy (~2 min)', 'success');
      if (btn) { btn.textContent = '✓ Saved'; setTimeout(() => { if (btn) btn.textContent = 'Save visibility changes'; }, 3000); }
      loadSyncBadge();
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Save visibility changes'; }
    } finally {
      savingVisibility = false;
    }
  }

  function boot() {
    buildPortal();
    togglePreview(true);
    setInterval(loadSyncBadge, 30000);
    setInterval(() => { githubToken = null; }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
