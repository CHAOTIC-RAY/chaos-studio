/**
 * Chaos Studio CMS — Admin Portal
 * Split-view preview + section visibility toggles
 * Works on top of native Sveltia CMS, does NOT intercept routes
 */
(function () {
  'use strict';

  const SITE = 'https://portfolio.chaoticstudio.workers.dev';
  const REPO = 'CHAOTIC-RAY/portfolio';
  const BRANCH = 'main';
  const SYNC_URL = '/admin/sync-status.json';
  const PORTFOLIO_JSON_PATH = 'content/portfolio.json';

  // Map CMS hash routes → live site anchors
  const ROUTE_MAP = [
    { match: /campaign-meta|social-posts/,        url: SITE + '/#posts',      label: 'Campaign & feed' },
    { match: /gallery-posts/,                      url: SITE + '/gallery',     label: 'Gallery' },
    { match: /collections\/campaign/,             url: SITE + '/#posts',      label: 'Campaign & feed' },
    { match: /collections\/portfolio.*main/,       url: SITE + '/#about',      label: 'Home page' },
    { match: /collections\/portfolio.*gallery/,    url: SITE + '/gallery',     label: 'Gallery page' },
    { match: /collections\/chaos-studio/,          url: SITE + '/studio',      label: 'Studio page' },
    { match: /collections\/site/,                  url: SITE + '/',            label: 'Site config' },
    { match: /collections\/pages/,                 url: SITE + '/',            label: 'Page builder' },
  ];

  const ICONS = {
    eye:      '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff:   '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    split:    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>',
    desktop:  '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    tablet:   '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1"/></svg>',
    mobile:   '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1"/></svg>',
    refresh:  '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    close:    '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    layers:   '<svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    check:    '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    upload:   '<svg viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>',
  };

  function icon(name) {
    return `<span class="cms-icon" aria-hidden="true">${ICONS[name] || ''}</span>`;
  }

  let previewOpen = false;
  let previewDevice = 'desktop'; // desktop | tablet | mobile
  let sectionsOpen = false;
  let portfolioData = null;
  let githubToken = null;
  let savingVisibility = false;

  // ── Helpers ──────────────────────────────────────────────────
  function getToken() {
    if (githubToken) return githubToken;
    try {
      const u = JSON.parse(localStorage.getItem('sveltia-cms.user') || localStorage.getItem('decap-cms-user') || 'null');
      if (u?.token) { githubToken = u.token; return u.token; }
    } catch { /* ignore */ }
    return '';
  }

  function routeLabel() {
    const h = location.hash;
    const hit = ROUTE_MAP.find(r => r.match.test(h));
    return hit ? hit.label : 'Chaos Studio CMS';
  }

  function previewUrl() {
    const h = location.hash;
    const hit = ROUTE_MAP.find(r => r.match.test(h));
    return hit ? hit.url : SITE + '/';
  }

  function showToast(msg, type = '') {
    document.querySelector('.cms-toast')?.remove();
    const t = document.createElement('div');
    t.className = `cms-toast${type ? ` cms-toast--${type}` : ''}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ── GitHub API ────────────────────────────────────────────────
  async function ghGet(path) {
    const tok = getToken();
    if (!tok) return null;
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`, {
      headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
    });
    if (!res.ok) return null;
    const meta = await res.json();
    const text = new TextDecoder().decode(Uint8Array.from(atob(meta.content.replace(/\n/g, '')), c => c.charCodeAt(0)));
    return { data: JSON.parse(text), sha: meta.sha };
  }

  async function ghPut(path, content, message, sha) {
    const tok = getToken();
    if (!tok) throw new Error('Not authenticated');
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2) + '\n')));
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: JSON.stringify({ message, branch: BRANCH, content: encoded, sha })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub: ${res.status} ${err.slice(0, 100)}`);
    }
    return res.json();
  }

  // ── Build Portal HTML ─────────────────────────────────────────
  function buildPortal() {
    if (document.getElementById('cms-bar')) return;

    // Top bar
    const bar = document.createElement('div');
    bar.id = 'cms-bar';
    bar.innerHTML = `
      <img class="cms-bar__logo" src="/icons/icon-192.png" alt="" />
      <span class="cms-bar__name">Chaos Studio CMS</span>
      <span class="cms-bar__sep"></span>
      <span class="cms-bar__context" id="cms-bar-context">Content editor</span>
      <div class="cms-bar__spacer"></div>
      <button class="cms-bar__btn" id="cms-sections-btn" title="Section visibility">
        ${icon('layers')} Sections
      </button>
      <button class="cms-bar__btn" id="cms-split-btn" title="Toggle preview panel">
        ${icon('split')} Preview
      </button>
      <div class="cms-bar__group" id="cms-device-group">
        <button class="cms-bar__btn is-active" data-device="desktop" title="Desktop preview">${icon('desktop')}</button>
        <button class="cms-bar__btn" data-device="tablet" title="Tablet preview">${icon('tablet')}</button>
        <button class="cms-bar__btn" data-device="mobile" title="Mobile preview">${icon('mobile')}</button>
      </div>
      <span class="cms-bar__sync" id="cms-sync-badge">Checking…</span>
    `;
    document.body.prepend(bar);

    // Wrap nc-root and preview in layout container
    const nc = document.getElementById('nc-root');
    const layout = document.createElement('div');
    layout.id = 'cms-layout';

    const editorPane = document.createElement('div');
    editorPane.id = 'cms-editor-pane';

    const resizer = document.createElement('div');
    resizer.id = 'cms-resizer';

    const previewPane = document.createElement('div');
    previewPane.id = 'cms-preview-pane';
    previewPane.innerHTML = `
      <div class="cms-preview__bar">
        <span class="cms-preview__title">Live Preview</span>
        <span class="cms-preview__url" id="cms-preview-url">${SITE}/</span>
        <span class="cms-preview__badge">Published only</span>
        <button class="cms-preview__refresh" id="cms-preview-refresh" title="Reload preview">
          ${ICONS['refresh']}
        </button>
      </div>
      <div class="cms-preview__viewport" id="cms-preview-viewport">
        <iframe id="cms-preview-frame" src="${SITE}/" loading="lazy" title="Site preview"></iframe>
      </div>
    `;

    document.body.insertBefore(layout, document.body.firstChild.nextSibling);
    layout.appendChild(editorPane);
    layout.appendChild(resizer);
    layout.appendChild(previewPane);
    editorPane.appendChild(nc);

    // Section visibility panel
    const sectionsPanel = document.createElement('div');
    sectionsPanel.id = 'cms-sections-panel';
    sectionsPanel.innerHTML = `
      <div class="cms-sections__header">
        <span class="cms-sections__title">
          ${ICONS['layers']} Section visibility
        </span>
        <button class="cms-sections__close" id="cms-sections-close">${ICONS['close']}</button>
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
    // Split view toggle
    document.getElementById('cms-split-btn')?.addEventListener('click', togglePreview);

    // Refresh preview
    document.getElementById('cms-preview-refresh')?.addEventListener('click', refreshPreview);

    // Device toggle
    document.getElementById('cms-device-group')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-device]');
      if (!btn) return;
      setDevice(btn.dataset.device);
    });

    // Sections panel open/close
    document.getElementById('cms-sections-btn')?.addEventListener('click', () => toggleSections());
    document.getElementById('cms-sections-close')?.addEventListener('click', () => toggleSections(false));

    // Save sections
    document.getElementById('cms-sections-save')?.addEventListener('click', saveSections);

    // Resizer drag
    const resizer = document.getElementById('cms-resizer');
    if (resizer) {
      let dragging = false, startX = 0, startW = 0;
      resizer.addEventListener('mousedown', e => {
        const pane = document.getElementById('cms-preview-pane');
        if (!pane || !previewOpen) return;
        dragging = true;
        startX = e.clientX;
        startW = pane.getBoundingClientRect().width;
        resizer.classList.add('is-dragging');
        e.preventDefault();
      });
      document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const pane = document.getElementById('cms-preview-pane');
        const layout = document.getElementById('cms-layout');
        if (!pane || !layout) return;
        const layoutW = layout.getBoundingClientRect().width;
        const newW = Math.min(Math.max(startW + (startX - e.clientX), 300), layoutW - 300);
        pane.style.flexBasis = `${newW}px`;
      });
      document.addEventListener('mouseup', () => {
        dragging = false;
        resizer.classList.remove('is-dragging');
      });
    }

    // Watch hash changes to update context label and preview URL
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
      if (frame) frame.src = url;
      if (urlEl) urlEl.textContent = url.replace('https://', '');
    }
  }

  // ── Preview panel ─────────────────────────────────────────────
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

  // ── Section visibility panel ──────────────────────────────────
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

    // Collect toggle values
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

  // ── Boot ─────────────────────────────────────────────────────
  function boot() {
    buildPortal();
    // Refresh sync badge every 30s
    setInterval(loadSyncBadge, 30000);
    // Watch auth state changes
    setInterval(() => { githubToken = null; }, 60000); // reset token cache
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
