/**
 * Halftone dot-matrix text — many small round dots per glyph (portfolio-style).
 * Samples rendered type on a grid; not block pixel font.
 */
(function () {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function parseColor(el, fallback) {
    const v = el.getAttribute("data-dot-color") || getComputedStyle(el).getPropertyValue("--dot-type-fg").trim();
    return v || fallback;
  }

  function render(el) {
    if (el.dataset.dotRendered === "1") return;
    const text = (el.getAttribute("data-dot-text") || el.textContent || "").trim();
    if (!text) return;

    const mobile = matchMedia("(max-width: 520px)").matches;
    const sizeAttr = el.getAttribute("data-dot-size");
    const fontSize = sizeAttr ? parseInt(sizeAttr, 10) : mobile ? 28 : 36;
    const weight = el.getAttribute("data-dot-weight") || "800";
    const family = el.getAttribute("data-dot-font") || "Syne, sans-serif";
    const lowercase = el.classList.contains("dot-display") || el.getAttribute("data-dot-case") === "lower";
    const display = lowercase ? text.toLowerCase() : text.toUpperCase();
    const color = parseColor(el, "#d690e8");
    const cell = mobile ? 2.75 : 2.35;
    const dotR = mobile ? 0.95 : 1.05;

    const pad = cell * 2;
    const meas = document.createElement("canvas");
    const mctx = meas.getContext("2d");
    if (!mctx) return;
    mctx.font = `${weight} ${fontSize}px ${family}`;
    const w = Math.ceil(mctx.measureText(display).width + pad * 2);
    const h = Math.ceil(fontSize * 1.15 + pad);
    meas.width = w;
    meas.height = h;
    mctx.font = `${weight} ${fontSize}px ${family}`;
    mctx.fillStyle = "#fff";
    mctx.textBaseline = "alphabetic";
    mctx.fillText(display, pad, pad + fontSize * 0.88);

    const src = mctx.getImageData(0, 0, w, h);
    const out = document.createElement("canvas");
    out.className = "dot-matrix-canvas";
    out.width = w;
    out.height = h;
    out.setAttribute("role", "img");
    out.setAttribute("aria-label", text);
    const octx = out.getContext("2d");
    octx.fillStyle = color;

    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const sx = Math.min(w - 1, Math.round(x));
        const sy = Math.min(h - 1, Math.round(y));
        const i = (sy * w + sx) * 4;
        const a = src.data[i + 3];
        const lum = 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
        if (a > 48 && lum > 40) {
          octx.beginPath();
          octx.arc(x, y, dotR, 0, Math.PI * 2);
          octx.fill();
        }
      }
    }

    el.textContent = "";
    el.classList.add("dot-matrix-text");
    el.appendChild(out);
    el.dataset.dotRendered = "1";
    if (RM) el.classList.add("dot-matrix-text--static");
  }

  function boot() {
    document.querySelectorAll("[data-dot-text], .dot-display:not([data-dot-skip])").forEach((el) => {
      if (!el.getAttribute("data-dot-text")) el.setAttribute("data-dot-text", el.textContent.trim());
      render(el);
    });
    document.querySelectorAll(".wordmark-studio:not([data-dot-text])").forEach((el) => {
      el.setAttribute("data-dot-text", "STUDIO");
      el.setAttribute("data-dot-size", matchMedia("(max-width: 520px)").matches ? "11" : "13");
      el.setAttribute("data-dot-font", "Anton, sans-serif");
      render(el);
    });
  }

  window.ChaosDotMatrixText = { render, boot };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
