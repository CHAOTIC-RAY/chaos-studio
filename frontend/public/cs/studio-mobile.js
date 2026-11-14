(function () {
  const coarse = () => matchMedia("(max-width: 720px)").matches;
  if (!document.body.classList.contains("route-studio")) return;

  const tabs = [...document.querySelectorAll(".studio-tab[data-section]")];
  const map = {
    studio: ["#top", ".hero", ".about"],
    work: ["#work"],
    packages: ["#packages"],
    contact: ["#studio-contact", ".studio-finale"],
  };

  function setActive(id) {
    tabs.forEach((t) => {
      const on = t.dataset.section === id;
      t.classList.toggle("is-active", on);
      if (on) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
  }

  function onScroll() {
    if (!coarse()) return;
    activeSection();
    let current = "studio";
    const y = scrollY + innerHeight * 0.38;
    for (const [id, sels] of Object.entries(map)) {
      for (const sel of sels) {
        const el = document.querySelector(sel);
        if (el && el.offsetTop <= y) current = id;
      }
    }
    setActive(current);
  }

  const menuBtn = document.getElementById("menu-btn");
  document.querySelector(".studio-tab--menu")?.addEventListener("click", (e) => {
    e.preventDefault();
    menuBtn?.click();
  });

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      if (t.dataset.section) setActive(t.dataset.section);
    });
  });

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("hashchange", onScroll, { passive: true });
  onScroll();
})();