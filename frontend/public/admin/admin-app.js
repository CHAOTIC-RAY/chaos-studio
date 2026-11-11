const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const DEVICE_LAYOUTS = [
  "laptop",
  "browser",
  "tablet",
  "phone",
  "dual",
  "phone-only",
  "dual-phone",
];

const SLOTS = {
  laptop: ["laptop"],
  browser: ["browser"],
  tablet: ["tablet"],
  phone: ["phone"],
  dual: ["laptop", "phone"],
  "phone-only": ["phone"],
  "dual-phone": ["phone", "phone2"],
};

export function createApp({ content, api, root }) {
  let state = structuredClone(content);
  let tab = "hero";

  function setStatus(msg) {
    const el = $("#status", root);
    if (el) el.textContent = msg || "";
  }

  async function upload(file) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/media/upload", { method: "POST", body: fd, credentials: "same-origin" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  }

  function bindTabs() {
    $$("#tabs .tabs__btn", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        tab = btn.dataset.tab;
        $$("#tabs .tabs__btn", root).forEach((b) => b.classList.toggle("is-active", b === btn));
        renderPanel();
      });
    });
  }

  function field(label, id, value, type = "text") {
    if (type === "textarea") {
      return `<label class="field"><span>${label}</span><textarea class="input" id="${id}">${value ?? ""}</textarea></label>`;
    }
    return `<label class="field"><span>${label}</span><input class="input" id="${id}" type="${type}" value="${value ?? ""}"></label>`;
  }

  function renderHero() {
    return `<motion class="card">${field("SEO title", "seo-title", state.seo?.title)}
      ${field("SEO description", "seo-desc", state.seo?.description, "textarea")}
      ${field("Hero headline (HTML ok)", "hero-hl", state.hero?.headline, "textarea")}
      ${field("Hero pitch", "hero-pitch", state.hero?.pitch, "textarea")}
      ${field("WhatsApp URL", "c-wa", state.contact?.whatsappUrl)}
      ${field("Telegram URL", "c-tg", state.contact?.telegramUrl)}
      ${field("Primary CTA label", "c-pri", state.hero?.primaryCta?.label)}
      ${field("Secondary CTA label", "c-sec", state.hero?.secondaryCta?.label)}</motion>`;
  }

  function renderServices() {
    return state.services
      .map(
        (s, i) => `<article class="card" data-i="${i}">
      <div class="card__head"><h3>Service ${i + 1}</h3><motion class="row-actions">
        <button type="button" class="btn" data-up-svc="${i}">↑</button>
        <button type="button" class="btn" data-down-svc="${i}">↓</button>
        <button type="button" class="btn btn--danger" data-del-svc="${i}">Delete</button>
      </motion></div>
      ${field("Title", `svc-t-${i}`, s.title)}
      ${field("Description", `svc-d-${i}`, s.description, "textarea")}
      ${field("Icon key", `svc-k-${i}`, s.iconKey)}
      <label class="field"><span>Wide tile</span><input type="checkbox" id="svc-w-${i}" ${s.wide ? "checked" : ""}></label>
    </article>`,
      )
      .concat(
        `<button type="button" class="btn btn--primary" id="add-svc">Add service</button>`,
      )
      .join("");
  }

  function renderPackages() {
    return state.packages
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((p, i) => {
        const dels = (p.deliverables || [])
          .map(
            (d, j) => `<div class="grid-2" style="margin-bottom:8px">
          ${field(`Item ${j + 1}`, `pk-d-t-${i}-${j}`, d.text)}
          ${field("Icon key", `pk-d-k-${i}-${j}`, d.iconKey || "")}
        </div>`,
          )
          .join("");
        return `<article class="card" data-pk="${i}">
        <div class="card__head"><h3>${p.name || "Package"}</h3><motion class="row-actions">
          <button type="button" class="btn" data-up-pk="${i}">↑</button>
          <button type="button" class="btn" data-down-pk="${i}">↓</button>
          <button type="button" class="btn btn--danger" data-del-pk="${i}">Delete</button>
        </motion></div>
        ${field("Name", `pk-n-${i}`, p.name)}
        ${field("Tagline", `pk-tag-${i}`, p.tagline, "textarea")}
        ${field("Price", `pk-price-${i}`, p.price)}
        ${field("WhatsApp text", `pk-wa-${i}`, p.whatsappText, "textarea")}
        ${field("Icon key", `pk-ico-${i}`, p.iconKey)}
        <label class="field"><span>Featured</span><input type="checkbox" id="pk-feat-${i}" ${p.featured ? "checked" : ""}></label>
        <h4>Deliverables</h4>${dels}
        <button type="button" class="btn" data-add-del="${i}">+ deliverable</button>
      </article>`;
      })
      .concat(`<button type="button" class="btn btn--primary" id="add-pk">Add package</button>`)
      .join("");
  }

  function renderWhy() {
    return `${field("Brace tag", "why-brace", state.whyBrace || "{no middlemen}")}${state.whyUs
      .map(
        (w, i) => `<article class="card" data-why="${i}">
      <div class="card__head"><h3>${w.title}</h3></div>
      ${field("Title", `why-t-${i}`, w.title)}
      ${field("Body", `why-b-${i}`, w.body, "textarea")}
      ${field("Icon key", `why-k-${i}`, w.iconKey)}
    </article>`,
      )
      .join("")}`;
  }

  function projectPreview(p) {
    if (!window.ChaosShowcasePreview) return "<p class='muted'>Preview loads with showcase.js</p>";
    const item = {
      ...p,
      screenshots: p.screenshots || {},
      deviceLayout: p.deviceLayout || p.layout || "browser",
    };
    return `<div class="device-preview">${window.ChaosShowcasePreview.devicesHtml(item, p.title || p.slug)}</div>`;
  }

  function renderProjects() {
    const sorted = [...(state.featuredWork || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sorted
      .map((p, i) => {
        const layout = p.deviceLayout || p.layout || "dual";
        const shots = p.screenshots || {};
        const slots = SLOTS[layout] || ["browser"];
        const slotFields = slots
          .map(
            (slot) => `<label class="field"><span>${slot} URL</span>
          <input class="input" id="pj-${i}-${slot}" value="${shots[slot] || p.desktop || p.mobile || ""}">
          <input type="file" accept="image/*" data-upload-pj="${i}" data-slot="${slot}"></label>`,
          )
          .join("");
        return `<article class="card" data-pj="${i}">
        <div class="card__head"><h3>${p.title || p.slug}</h3><motion class="row-actions">
          <button type="button" class="btn" data-up-pj="${i}">↑</button>
          <button type="button" class="btn" data-down-pj="${i}">↓</button>
        </motion></div>
        ${field("Title", `pj-title-${i}`, p.title)}
        ${field("Tagline", `pj-tag-${i}`, p.tagline)}
        ${field("Href", `pj-href-${i}`, p.href)}
        ${field("URL chrome", `pj-url-${i}`, p.url)}
        <label class="field"><span>Device layout</span>
          <select class="input" id="pj-layout-${i}">${DEVICE_LAYOUTS.map((d) => `<option value="${d}" ${layout === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>
        ${field("App icon URL", `pj-icon-${i}`, p.appIconUrl || "")}
        <label class="field"><span>Upload app icon</span><input type="file" accept="image/*" data-upload-icon="${i}"></label>
        ${slotFields}
        ${projectPreview(p)}
      </article>`;
      })
      .join("");
  }

  function renderFooter() {
    return `<motion class="card">${field("Showcase headline", "show-h", state.showcaseHeadline)}
      ${field("Footer line", "foot", state.footer?.line)}
      ${field("About title (HTML)", "about-t", state.about?.title, "textarea")}
      ${field("About copy", "about-c", state.about?.copy, "textarea")}
      ${field("Finale brace", "fin-brace", state.finale?.brace)}</motion>`;
  }

  async function renderHistory() {
    let list = [];
    try {
      list = (await api("/api/content/history")).history || [];
    } catch {
      list = [];
    }
    return `<ul class="history-list">${list
      .map(
        (h) => `<li><span>${h.savedAt}</span>
        <button type="button" class="btn" data-restore-at="${h.savedAt}">Restore</button></li>`,
      )
      .join("")}</ul>`;
  }

  async function renderPanel() {
    const panel = $("#panel", root);
    let html = "";
    if (tab === "hero") html = renderHero();
    else if (tab === "services") html = renderServices();
    else if (tab === "packages") html = renderPackages();
    else if (tab === "why") html = renderWhy();
    else if (tab === "projects") html = renderProjects();
    else if (tab === "footer") html = renderFooter();
    else if (tab === "history") html = await renderHistory();
    panel.innerHTML = html;
    bindPanelEvents();
  }

  function readForm() {
    const v = (id) => document.getElementById(id)?.value;
    const c = (id) => document.getElementById(id)?.checked;
    state.seo = { ...state.seo, title: v("seo-title"), description: v("seo-desc") };
    state.hero = {
      ...state.hero,
      headline: v("hero-hl"),
      pitch: v("hero-pitch"),
      primaryCta: { ...state.hero.primaryCta, label: v("c-pri") },
      secondaryCta: { ...state.hero.secondaryCta, label: v("c-sec") },
    };
    state.contact = { ...state.contact, whatsappUrl: v("c-wa"), telegramUrl: v("c-tg") };
    state.whyBrace = v("why-brace");
    state.showcaseHeadline = v("show-h");
    state.footer = { line: v("foot") };
    state.about = { ...state.about, title: v("about-t"), copy: v("about-c") };
    state.finale = { ...state.finale, brace: v("fin-brace") };
    state.services = state.services.map((s, i) => ({
      ...s,
      title: v(`svc-t-${i}`) ?? s.title,
      description: v(`svc-d-${i}`) ?? s.description,
      iconKey: v(`svc-k-${i}`) ?? s.iconKey,
      wide: c(`svc-w-${i}`),
    }));
    state.packages = state.packages.map((p, i) => ({
      ...p,
      name: v(`pk-n-${i}`) ?? p.name,
      tagline: v(`pk-tag-${i}`) ?? p.tagline,
      price: v(`pk-price-${i}`) ?? p.price,
      whatsappText: v(`pk-wa-${i}`) ?? p.whatsappText,
      iconKey: v(`pk-ico-${i}`) ?? p.iconKey,
      featured: c(`pk-feat-${i}`),
      deliverables: (p.deliverables || []).map((d, j) => ({
        text: v(`pk-d-t-${i}-${j}`) ?? d.text,
        iconKey: v(`pk-d-k-${i}-${j}`) ?? d.iconKey,
      })),
    }));
    state.whyUs = state.whyUs.map((w, i) => ({
      ...w,
      title: v(`why-t-${i}`) ?? w.title,
      body: v(`why-b-${i}`) ?? w.body,
      iconKey: v(`why-k-${i}`) ?? w.iconKey,
    }));
    const sorted = [...state.featuredWork].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    state.featuredWork = sorted.map((p, i) => {
      const layout = v(`pj-layout-${i}`) || p.deviceLayout || "dual";
      const slots = SLOTS[layout] || ["browser"];
      const screenshots = { ...(p.screenshots || {}) };
      slots.forEach((slot) => {
        const val = v(`pj-${i}-${slot}`);
        if (val) screenshots[slot] = val;
      });
      return {
        ...p,
        title: v(`pj-title-${i}`) ?? p.title,
        tagline: v(`pj-tag-${i}`) ?? p.tagline,
        href: v(`pj-href-${i}`) ?? p.href,
        url: v(`pj-url-${i}`) ?? p.url,
        deviceLayout: layout,
        appIconUrl: v(`pj-icon-${i}`) || p.appIconUrl,
        screenshots,
        desktop: screenshots.laptop || screenshots.browser || p.desktop,
        mobile: screenshots.phone || p.mobile,
        order: i,
      };
    });
  }

  function bindPanelEvents() {
    $("#add-svc", root)?.addEventListener("click", () => {
      state.services.push({ id: `svc-${Date.now()}`, title: "New service", description: "", iconKey: "app", wide: false });
      renderPanel();
    });
    $$("[data-del-svc]", root).forEach((b) =>
      b.addEventListener("click", () => {
        state.services.splice(+b.dataset.delSvc, 1);
        renderPanel();
      }),
    );
    $("#add-pk", root)?.addEventListener("click", () => {
      state.packages.push({
        id: `pkg-${Date.now()}`,
        name: "New package",
        tagline: "",
        price: "0",
        currency: "MVR",
        iconKey: "starter",
        deliverables: [],
        whatsappText: "",
        order: state.packages.length,
      });
      renderPanel();
    });
    $$("[data-upload-pj]", root).forEach((inp) =>
      inp.addEventListener("change", async () => {
        const file = inp.files?.[0];
        if (!file) return;
        try {
          setStatus("Uploading…");
          const url = await upload(file);
          const [i, slot] = [inp.dataset.uploadPj, inp.dataset.slot];
          const el = document.getElementById(`pj-${i}-${slot}`);
          if (el) el.value = url;
          setStatus("Uploaded " + url);
        } catch (e) {
          setStatus(e.message);
        }
      }),
    );
    $$("[data-upload-icon]", root).forEach((inp) =>
      inp.addEventListener("change", async () => {
        const file = inp.files?.[0];
        if (!file) return;
        try {
          const url = await upload(file);
          const el = document.getElementById(`pj-icon-${inp.dataset.uploadIcon}`);
          if (el) el.value = url;
          setStatus("Icon uploaded");
        } catch (e) {
          setStatus(e.message);
        }
      }),
    );
    $$("[data-restore-at]", root).forEach((b) =>
      b.addEventListener("click", async () => {
        const restored = await api("/api/content/restore", { method: "POST", body: JSON.stringify({ savedAt: b.dataset.restoreAt }) });
        state = restored;
        setStatus("Restored " + restored.updatedAt);
        renderPanel();
      }),
    );
  }

  function bindSave() {
    $("#save", root)?.addEventListener("click", async () => {
      try {
        readForm();
        const saved = await api("/api/content", { method: "PUT", body: JSON.stringify(state) });
        state = saved;
        setStatus("Saved " + saved.updatedAt);
      } catch (e) {
        setStatus(e.message);
      }
    });
    $("#restore", root)?.addEventListener("click", async () => {
      if (!confirm("Restore bundled defaults?")) return;
      const saved = await api("/api/content/restore-defaults", { method: "POST", body: "{}" });
      state = saved;
      setStatus("Defaults restored");
      renderPanel();
    });
  }

  return {
    mount() {
      bindTabs();
      bindSave();
      renderPanel();
      setStatus(state.updatedAt ? `Loaded ${state.updatedAt}` : "");
    },
  };
}
