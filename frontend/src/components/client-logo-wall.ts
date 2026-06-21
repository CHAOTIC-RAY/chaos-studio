import type { ClientLogoWall } from "../types/portfolio";

export function renderClientLogoWall(clientLogoWall: ClientLogoWall): string {
  if (!clientLogoWall.enabled || !clientLogoWall.logos.length) {
    return "";
  }

  return `
    <section class="section section--client-logos" data-reveal>
      <div class="section-head">
        <p class="eyebrow">${esc(clientLogoWall.subtitle || "Trusted by leading brands")}</p>
      </div>
      <div class="client-logos-grid">
        ${clientLogoWall.logos.map((logo) => `
          <div class="client-logo-item">
            ${logo.link 
              ? `<a href="${esc(logo.link)}" target="_blank" rel="noopener noreferrer" class="client-logo-link">`
              : ""
            }
            <img src="${esc(logo.logo)}" alt="${esc(logo.alt)}" class="client-logo-img" loading="lazy" />
            ${logo.link ? "</a>" : ""}
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
