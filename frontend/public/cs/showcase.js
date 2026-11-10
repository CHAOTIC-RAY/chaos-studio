(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PLACEHOLDER = "/assets/work/_placeholders/default-cover.svg";

  const FEATURED = [
    { slug: "kora", mod: "feat--kora" },
    { slug: "faisa", title: "Faisa Mobile", mod: "feat--faisa" },
    {
      slug: "xyz",
      title: "XYZ",
      cover: "/images/projects/frames/faisa/06-transfer.webp",
      tagline: "Transfer & wallet flows — FaisaMobileXYZ",
      mod: "feat--xyz",
      from: "faisa",
    },
    { slug: "forge", mod: "feat--forge" },
    { slug: "GexTag", title: "UtilityBox", mod: "feat--utility" },
    { slug: "QuePulse", mod: "feat--quepulse" },
  ];

  const grid = $("#showcase-grid");
  const headline = $("#showcase-headline");
  const cta = $("#showcase-portfolio-cta");
  if (!grid) return;

  grid.classList.add("featured-bento");

  function tile(item, project, i) {
    const title = item.title || project.title;
    const cover = item.cover || project.cover || PLACEHOLDER;
    const alt = project.coverAlt || title;
    const href = project.href || "#";
    const tag = item.tagline || project.tagline || project.category || "";
    const num = String(i + 1).padStart(2, "0");
    const placeholder = !project.cover && !item.cover;
    return `<li class="feat ${item.mod || ""}" data-reveal style="--d:${i * 55}ms">
      <a class="feat-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer"${placeholder ? ' data-placeholder="1"' : ""}>
        <span class="dot-num dot-num--sm dot-num--lime feat-num" data-dots="${num}" data-dot-variant="lime"></span>
        <span class="feat-media"><img src="${esc(cover)}" alt="${esc(alt)}" loading="lazy" decoding="async" width="640" height="480" onerror="this.onerror=null;this.src='${PLACEHOLDER}'"></span>
        <span class="feat-meta">
          <span class="feat-cat">${esc(project.category || "Product")}</span>
          <span class="feat-title">${esc(title)}</span>
          <span class="feat-tag">${esc(tag)}</span>
        </span>
      </a>
    </li>`;
  }

  fetch("/assets/site.config.json")
    .then((r) => r.json())
    .then((cfg) => {
      const bySlug = Object.fromEntries((cfg.work || []).map((w) => [w.slug.toLowerCase(), w]));
      const html = [];
      const used = [];
      FEATURED.forEach((item, i) => {
        const key = (item.from || item.slug).toLowerCase();
        const project = bySlug[key] || bySlug[item.slug.toLowerCase()];
        if (!project) return;
        used.push({ item, project, real: !!(item.cover || project.cover) });
        html.push(tile(item, project, i));
      });
      grid.innerHTML = html.join("");
      if (headline) headline.textContent = "Product design & tools we ship — six featured builds.";
      grid.setAttribute("aria-busy", "false");
      window.ChaosDotNumerals && grid.querySelectorAll("[data-dots]").forEach((el) => window.ChaosDotNumerals.renderDots(el));

      if (reduced()) {
        grid.querySelectorAll(".feat").forEach((c) => c.classList.add("in"));
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
        { threshold: 0.06, rootMargin: "0px 0px -6% 0px" },
      );
      grid.querySelectorAll(".feat").forEach((c) => io.observe(c));
      grid.dataset.featuredMeta = JSON.stringify(used.map((u) => u.item.slug));
      document.dispatchEvent(new CustomEvent("cs-showcase-ready"));
    })
    .catch(() => {
      grid.innerHTML = "";
      grid.setAttribute("aria-busy", "false");
    });
})();
