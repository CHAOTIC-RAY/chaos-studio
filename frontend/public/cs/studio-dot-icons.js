/** Halftone dot SVG icons — /assets/motifs/dot-icons/ */
(function () {
  const BASE = "/assets/motifs/dot-icons/";

  const SERVICE = {
    interior: "dot-home.svg",
    architecture: "dot-layers.svg",
    app: "dot-phone.svg",
    web: "dot-monitor.svg",
    brand: "dot-logo.svg",
    jersey: "dot-star.svg",
    video: "dot-play.svg",
    social: "dot-megaphone.svg",
    print: "dot-brush.svg",
  };

  const FEATURE = {
    posts: "dot-image.svg",
    reel: "dot-play.svg",
    strategy: "dot-chart.svg",
    logo: "dot-logo.svg",
    letter: "dot-file.svg",
    jersey: "dot-star.svg",
    banner: "dot-image.svg",
    social: "dot-hashtag.svg",
  };

  const PACKAGE = {
    "monthly-social": { icon: "dot-megaphone.svg", featureIcon: "dot-chart.svg" },
    starter: { icon: "dot-logo.svg", featureIcon: "dot-image.svg" },
    "business-booster": { icon: "dot-rocket.svg", featureIcon: "dot-logo.svg" },
    "complete-branding": { icon: "dot-palette.svg", featureIcon: "dot-palette.svg" },
    "event-marketing": { icon: "dot-calendar.svg", featureIcon: "dot-image.svg" },
  };

  const WHY = {
    affordable: "dot-check.svg",
    fast: "dot-bolt.svg",
    tailored: "dot-target.svg",
  };

  function img(file, className, size) {
    const s = size || 48;
    return `<img class="dot-icon${className ? ` ${className}` : ""}" src="${BASE}${file}" alt="" width="${s}" height="${s}" loading="eager" decoding="sync" fetchpriority="low">`;
  }

  function paintAll() {
    document.querySelectorAll(".svc-ico img.dot-icon, .why-dot-ico img.dot-icon, .pk-dot-icon img.dot-icon, .deliverable-ico img.dot-icon").forEach((img) => {
      img.loading = "eager";
    });
  }

  function featureIconFor(text) {
    const t = String(text).toLowerCase();
    if (/reel/.test(t)) return FEATURE.reel;
    if (/strateg|plan/.test(t)) return FEATURE.strategy;
    if (/logo/.test(t)) return FEATURE.logo;
    if (/letter/.test(t)) return FEATURE.letter;
    if (/jersey/.test(t)) return FEATURE.jersey;
    if (/banner|poster/.test(t)) return FEATURE.banner;
    if (/post/.test(t)) return FEATURE.posts;
    if (/social/.test(t)) return FEATURE.social;
    return "dot-check.svg";
  }

  window.ChaosStudioDotIcons = {
    img,
    SERVICE,
    PACKAGE,
    WHY,
    featureIconFor,
    paintAll,
  };

  function bootPaint() {
    paintAll();
  }

  document.addEventListener("cms-content-ready", bootPaint);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootPaint);
  else bootPaint();
})();
