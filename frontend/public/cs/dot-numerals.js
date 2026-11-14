/** Brand dot-matrix numerals — SVG dot grids at readable scale (not shrunk to blobs). */
(function () {
  const BASE_ORIG = "/assets/motifs/dot-numerals-original/dot-numeral-";
  const BASE = "/assets/motifs/dot-numerals/dot-numeral-";
  const cache = new Map();

  function digitImg(d) {
    if (cache.has(d)) return cache.get(d).cloneNode(true);
    const img = document.createElement("img");
    img.src = `${BASE_ORIG}${d}.svg`;
    img.onerror = () => {
      img.onerror = null;
      img.src = `${BASE}${d}.svg`;
    };
    img.alt = d;
    img.decoding = "async";
    img.loading = "lazy";
    img.className = "dot-digit";
    img.width = 48;
    img.height = 26;
    cache.set(d, img);
    return img.cloneNode(true);
  }

  function renderDots(el) {
    if (el.closest(".price, .amt")) return;
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
      if (ch >= "0" && ch <= "9") wrap.appendChild(digitImg(ch));
    }
    el.appendChild(wrap);
  }

  function boot() {
    document.querySelectorAll("[data-dots]").forEach(renderDots);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.ChaosDotNumerals = { renderDots, boot };
})();
