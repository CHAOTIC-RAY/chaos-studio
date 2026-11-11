(function () {
  window.ChaosStudioServices = function chaosStudioServices() {
    const list = document.querySelector(".svc-list");
    if (!list) return [];
    return [...list.querySelectorAll(".cond")].map((el) => el.textContent.trim()).filter(Boolean);
  };

  const D = window.ChaosStudioDotIcons;
  const keys = [
    "interior",
    "architecture",
    "app",
    "web",
    "brand",
    "jersey",
    "video",
    "social",
    "print",
  ];
  const blurbs = [
    "Spatial concepts, mood boards, and finish packages for homes and retail.",
    "Concept visuals and presentation-ready elevation studies.",
    "Native-feel UI flows, component libraries, and handoff specs.",
    "Marketing sites and product pages — fast, responsive, on-brand.",
    "Logos, kits, and guidelines that travel across print and social.",
    "Team kits and event jerseys with print-ready separations.",
    "Reels, promos, and motion-ready cuts for campaigns.",
    "Content calendars, paid creative, and channel-specific formats.",
    "Posters, flyers, and print collateral with bold type systems.",
  ];

  const svc = document.querySelector(".svc");
  const list = svc && svc.querySelector(".svc-list");
  if (!svc || !list || svc.querySelector(".svc-bento")) return;

  const bento = document.createElement("div");
  bento.className = "svc-bento";
  bento.setAttribute("role", "list");

  list.querySelectorAll("li").forEach((li, i) => {
    const cond = li.querySelector(".cond");
    const title = cond ? cond.textContent.trim() : "";
    const wide = i === 0 || i === 7;
    const tile = document.createElement("article");
    tile.className = "svc-tile" + (wide ? " svc-tile--wide" : "");
    tile.setAttribute("role", "listitem");
    const dotFile = D && D.SERVICE[keys[i]] ? D.SERVICE[keys[i]] : "dot-logo.svg";
    const iconMarkup = D ? D.img(dotFile, "svc-dot", 44) : "";
    tile.innerHTML = `
      <button type="button" class="svc-tile__head" aria-expanded="false">
        <span class="svc-ico" aria-hidden="true">${iconMarkup}</span>
        <h3>${title}</h3>
        <span class="svc-tile__chev" aria-hidden="true"></span>
      </button>
      <div class="svc-tile__body" hidden>
        <p>${blurbs[i] || ""}</p>
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

  document.querySelectorAll(".svc-list .cond.outline").forEach((el) => {
    el.classList.remove("outline");
    el.classList.add("dot-display", "dot-display--lilac");
  });
})();
