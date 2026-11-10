(function () {
  const P = "/images/posts";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(3, "0");
  const slugify = (s) =>
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const panoSrc = (u) => u.replace(/\.webp$/i, ".pano.webp");
  const slideSrc = (n, s) => `${P}/${n.id}/${s}.webp`;
  const LABEL = {
    branding: "Branding",
    social: "Social",
    carousel: "Carousel",
    reel: "Reel",
    print: "Print",
    jersey: "Jersey",
    webapp: "Web/App",
  };
  function cats(n) {
    const t = (n.tags || []).join(" ").toLowerCase();
    const k = (n.slides || []).length;
    const s = new Set();
    if (n.video) s.add("reel");
    if (k > 1) s.add("carousel");
    if (/jersey|uniform/.test(t)) s.add("jersey");
    if (/poster|print|banner|flyer/.test(t)) s.add("print");
    if (/brand|logo|identity/.test(t)) s.add("branding");
    const primary = ["reel", "jersey", "print", "branding", "carousel", "social"].find((c) => s.has(c)) || "social";
    return primary;
  }
  function cover(n) {
    if (n.video) return `${P}/${n.id}/${n.poster || "poster.webp"}`;
    if (n.slides && n.slides.length) return slideSrc(n, n.slides[0]);
    return `${P}/${n.id}.webp`;
  }

  const grid = $("#showcase-grid");
  const headline = $("#showcase-headline");
  const cta = $("#showcase-portfolio-cta");
  if (!grid) return;

  async function load() {
    const r = await fetch("/api/showcase", { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error("showcase");
    return r.json();
  }

  function card(n, i, portfolioUrl) {
    const cat = LABEL[cats(n)] || "Social";
    const href = `${portfolioUrl.replace(/\/$/, "")}/gallery/${slugify(`${n.client} ${n.title}`)}`;
    const img = panoSrc(cover(n));
    return `<li class="card" style="--d:${Math.min(i, 8) * 55}ms" data-reveal>
      <a class="fr" href="${esc(href)}" target="_blank" rel="noopener noreferrer">
        <span class="top"><span class="num">${pad(i + 1)}</span><span class="cat">${esc(cat)}</span></span>
        <span class="media"><img src="${esc(img)}" alt="${esc(n.title)} — ${esc(n.client)}" loading="lazy" decoding="async" width="416" height="520"></span>
        <span class="cap"><span class="hl2">${esc(n.client)} — ${esc(n.title)}</span></span>
      </a>
    </li>`;
  }

  load()
    .then((data) => {
      if (headline && data.headline) headline.textContent = data.headline;
      if (cta) {
        cta.href = data.portfolioGalleryUrl || "https://portfolio.chaoticstudio.workers.dev/gallery/";
        const label = data.portfolioCta || "Full gallery on portfolio";
        cta.textContent = `${label} →`;
      }
      const posts = (data.posts || []).slice(0, 6);
      grid.innerHTML = posts.map((p, i) => card(p, i, data.portfolioGalleryUrl || "/")).join("");
      if (reduced()) {
        grid.querySelectorAll(".card").forEach((c) => c.classList.add("in"));
        return;
      }
      const io = new IntersectionObserver(
        (es) => {
          es.forEach((x) => {
            if (x.isIntersecting) {
              x.target.classList.add("in");
              io.unobserve(x.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
      );
      requestAnimationFrame(() => grid.querySelectorAll(".card").forEach((c) => io.observe(c)));
    })
    .catch(() => {
      grid.innerHTML = "";
    });
})();
