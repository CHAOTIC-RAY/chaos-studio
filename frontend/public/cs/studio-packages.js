(function () {
  function wireToggles() {
    document.querySelectorAll(".pk-bento .pk").forEach((pk) => {
      const btn = pk.querySelector(".pk-toggle");
      if (!btn || btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", () => {
        const open = pk.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  function applyIcons() {
    const D = window.ChaosStudioDotIcons;
    if (!D) return;

    document.querySelectorAll("[data-why-icon]").forEach((el) => {
      const key = el.getAttribute("data-why-icon");
      const file = D.WHY[key];
      if (file) el.innerHTML = D.img(file, "why-dot", 52);
    });

    const cms = window.__SITE_CONTENT__;
    const byId = Object.fromEntries((cms?.packages || []).map((p) => [p.id, p]));

    document.querySelectorAll(".pk-bento .pk").forEach((pk) => {
      const id = pk.getAttribute("data-pkg-id");
      const conf = id && byId[id] ? D.PACKAGE[id] || D.PACKAGE[id.replace(/-/g, "_")] : null;
      const keyFromTitle = (cms?.packages || []).find((p) => p.name === pk.querySelector("h3")?.textContent)?.id;
      const key = id || keyFromTitle || "starter";
      const packConf = conf || D.PACKAGE[key] || D.PACKAGE.starter;

      const tag = pk.querySelector(".tag.fine");
      if (tag && /^package\s*0/i.test(tag.textContent)) tag.remove();

      let head = pk.querySelector(".pk-dot-icon");
      if (!head) {
        head = document.createElement("div");
        head.className = "pk-dot-icon";
        head.innerHTML = D.img(packConf.icon, "pk-dot-icon__img", 56);
        const h3 = pk.querySelector("h3");
        if (h3) pk.insertBefore(head, h3);
      }

      const pkg = byId[key] || byId[id];
      pk.querySelectorAll("ul li").forEach((li, idx) => {
        const num = li.querySelector("span:first-child");
        const label = li.querySelector("span:last-child");
        if (!label) return;
        const iconFile = D.featureIconFor(label.textContent);
        if (num && /^\d+$/.test(num.textContent.trim())) {
          num.outerHTML = `<span class="deliverable-ico" aria-hidden="true">${D.img(iconFile, "deliverable-dot", 32)}</span>`;
        }
      });
    });
    D.paintAll && D.paintAll();
  }

  window.ChaosStudioPackages = { wireToggles, applyIcons };

  document.addEventListener("cms-content-ready", () => {
    applyIcons();
    wireToggles();
  });
  document.addEventListener("cs-packages-ready", () => {
    applyIcons();
    wireToggles();
  });
  if (window.__SITE_CONTENT__) {
    applyIcons();
    wireToggles();
  }
})();
