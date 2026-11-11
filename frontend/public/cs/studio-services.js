(function () {
  window.ChaosStudioServices = function chaosStudioServices() {
    const cms = window.__SITE_CONTENT__;
    if (cms?.services?.length) return cms.services.map((s) => s.title);
    const list = document.querySelector(".svc-list");
    if (!list) return [];
    return [...list.querySelectorAll(".cond")].map((el) => el.textContent.trim()).filter(Boolean);
  };

  function buildBento() {
    const D = window.ChaosStudioDotIcons;
    const cms = window.__SITE_CONTENT__;
    const svc = document.querySelector(".svc");
    const list = svc && svc.querySelector(".svc-list");
    if (!svc || !list || svc.querySelector(".svc-bento")) return;

    const items = cms?.services?.length
      ? cms.services
      : [...list.querySelectorAll("li")].map((li, i) => ({
          title: li.querySelector(".cond")?.textContent.trim() || "",
          description: "",
          iconKey: ["interior", "architecture", "app", "web", "brand", "jersey", "video", "social", "print"][i],
          wide: i === 0 || i === 7,
        }));

    const bento = document.createElement("div");
    bento.className = "svc-bento";
    bento.setAttribute("role", "list");

    items.forEach((item, i) => {
      const title = item.title || "";
      const wide = item.wide ?? (i === 0 || i === 7);
      const dotFile = D && item.iconKey && D.SERVICE[item.iconKey] ? D.SERVICE[item.iconKey] : "dot-logo.svg";
      const iconMarkup = D ? D.img(dotFile, "svc-dot", 44) : "";
      const tile = document.createElement("article");
      tile.className = "svc-tile" + (wide ? " svc-tile--wide" : "");
      tile.setAttribute("role", "listitem");
      tile.innerHTML = `
        <button type="button" class="svc-tile__head" aria-expanded="false">
          <span class="svc-ico" aria-hidden="true">${iconMarkup}</span>
          <h3>${title}</h3>
          <span class="svc-tile__chev" aria-hidden="true"></span>
        </button>
        <div class="svc-tile__body" hidden>
          <p>${item.description || ""}</p>
          <a href="#packages">See packages ↓</a>
        </div>`;
      bento.appendChild(tile);
      const btn = tile.querySelector(".svc-tile__head");
      const body = tile.querySelector(".svc-tile__body");
      btn.addEventListener("click", () => {
        const open = tile.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        body.hidden = !open;
      });
    });

    svc.querySelector(".wrap").appendChild(bento);
    D && D.paintAll && D.paintAll();

    document.querySelectorAll(".svc-list .cond.outline").forEach((el) => {
      el.classList.remove("outline");
      el.classList.add("dot-display", "dot-display--lilac");
    });
  }

  function run() {
    buildBento();
  }

  document.addEventListener("cms-content-ready", run, { once: true });
  if (window.__SITE_CONTENT__) run();
})();
