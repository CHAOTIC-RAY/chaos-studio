/** Render brand dot-matrix numerals from /assets/motifs/dot-numerals/ */
(function () {
  const BASE = "/assets/motifs/dot-numerals/dot-numeral-";
  const cache = new Map();

  function digitImg(d, variant) {
    const key = `${variant}-${d}`;
    if (cache.has(key)) return cache.get(key).cloneNode(true);
    const img = document.createElement("img");
    img.src = `${BASE}${d}.svg`;
    img.alt = d;
    img.decoding = "async";
    img.loading = "lazy";
    img.className = "dot-digit";
    cache.set(key, img);
    return img.cloneNode(true);
  }

  function renderDots(el) {
    const raw = el.getAttribute("data-dots") || el.textContent.trim();
    const digits = String(raw).replace(/\D/g, "");
    if (!digits) return;
    const variant = el.getAttribute("data-dot-variant") || "lilac";
    el.textContent = "";
    el.classList.add("dot-num", `dot-num--${variant}`);
    const wrap = document.createElement("span");
    wrap.className = "dot-num__digits";
    wrap.setAttribute("aria-label", raw);
    for (const ch of digits) {
      if (ch >= "0" && ch <= "9") wrap.appendChild(digitImg(ch, variant));
    }
    el.appendChild(wrap);
  }

  function boot() {
    document.querySelectorAll("[data-dots]").forEach(renderDots);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.ChaosDotNumerals = { renderDots };
})();
