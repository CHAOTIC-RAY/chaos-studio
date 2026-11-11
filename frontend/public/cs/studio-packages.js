(function () {
  const D = window.ChaosStudioDotIcons;
  if (!D) return;

  document.querySelectorAll("[data-why-icon]").forEach((el) => {
    const key = el.getAttribute("data-why-icon");
    const file = D.WHY[key];
    if (file) el.innerHTML = D.img(file, "why-dot", 52);
  });

  const byTitle = [
    [/Monthly Social/i, "monthly-social"],
    [/Starter Package/i, "starter"],
    [/Business Booster/i, "business-booster"],
    [/Complete Branding/i, "complete-branding"],
    [/Event Marketing/i, "event-marketing"],
  ];

  document.querySelectorAll(".pk-bento .pk").forEach((pk) => {
    const title = pk.querySelector("h3")?.textContent || "";
    const row = byTitle.find(([re]) => re.test(title));
    const key = row ? row[1] : "starter";
    const conf = D.PACKAGE[key] || D.PACKAGE.starter;

    const tag = pk.querySelector(".tag.fine");
    if (tag && /^package\s*0/i.test(tag.textContent)) tag.remove();

    let head = pk.querySelector(".pk-dot-icon");
    if (!head) {
      head = document.createElement("div");
      head.className = "pk-dot-icon";
      head.innerHTML = D.img(conf.icon, "pk-dot-icon__img", 56);
      const h3 = pk.querySelector("h3");
      if (h3) pk.insertBefore(head, h3);
    }

    pk.querySelectorAll("ul li").forEach((li) => {
      const num = li.querySelector("span:first-child");
      const label = li.querySelector("span:last-child");
      if (!label) return;
      const iconFile = D.featureIconFor(label.textContent);
      if (num && /^\d+$/.test(num.textContent.trim())) {
        num.outerHTML = `<span class="deliverable-ico" aria-hidden="true">${D.img(iconFile, "deliverable-dot", 32)}</span>`;
      }
    });
  });
})();
