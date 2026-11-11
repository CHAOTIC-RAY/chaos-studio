import fs from "node:fs";

const p = new URL("../frontend/public/studio/index.html", import.meta.url);
let h = fs.readFileSync(p, "utf8");

const whyIcons = [
  ["Affordable", "affordable"],
  ["Fast", "fast"],
  ["Tailored", "tailored"],
];

for (const [title, key] of whyIcons) {
  const re = new RegExp(
    `<article class="why" data-why-card>[\\s\\S]*?<h3>${title.replace("&", "&amp;")}`,
  );
  h = h.replace(
    /<span class="num dot-num dot-num--xl dot-num--lime" data-dots="\d" data-dot-variant="lime" aria-hidden="true"><\/span>/,
    `<span class="num why-dot-ico" data-why-icon="${key}" aria-hidden="true"></span>`,
  );
}

fs.writeFileSync(p, h);
console.log("patched why icons placeholders");
