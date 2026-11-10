import fs from "node:fs";

const p = new URL("../frontend/public/studio/index.html", import.meta.url);
let h = fs.readFileSync(p, "utf8");

h = h.replace(/<div class="grow2" id="grow2"[\s\S]*?<\/svg><\/div>\s*/, "");

if (!h.includes("why-motif")) {
  h = h.replace(
    /<section class="sec g-plum whys" id="why"([^>]*)><div class="wrap">/,
    '<section class="sec g-plum whys" id="why"$1><div class="why-motif" aria-hidden="true"><img src="/assets/motifs/marks/chaos-mark-b.svg" alt="" width="240" height="240" decoding="async"></div><div class="wrap">',
  );
}

h = h.replace(
  '<h2 id="t-why" class="crush why-title">why us?</h2><p class="brace why-brace">{no middlemen}</p>',
  '<h2 id="t-why" class="why-title why-title--mask"><span class="why-title__inner">why us?</span></h2><p class="brace why-brace" data-why-brace><span class="why-brace__inner">{no middlemen}</span></p>',
);

h = h.replaceAll('<article class="why" data-reveal>', '<article class="why" data-why-card><span class="why-rule" aria-hidden="true"></span>');

if (!h.includes("why-bento")) {
  h = h.replace(
    '<span class="why-brace__inner">{no middlemen}</span></p>\n <article class="why"',
    '<span class="why-brace__inner">{no middlemen}</span></p>\n <div class="why-bento">\n <article class="why"',
  );
  h = h.replace(
    '</article></div></section>\n<section class="sec g-ink pks-sec"',
    '</article></div></div></section>\n<section class="sec g-ink pks-sec"',
  );
}

if (!h.includes("why-section.css")) {
  h = h.replace(
    '<link rel="stylesheet" href="/cs/hero-layout.css">',
    '<link rel="stylesheet" href="/cs/hero-layout.css"><link rel="stylesheet" href="/cs/why-section.css">',
  );
}

fs.writeFileSync(p, h);
console.log("ok", { grow2: h.includes("grow2"), bento: h.includes("why-bento") });
