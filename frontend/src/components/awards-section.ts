import type { PortfolioAwards } from "../types/portfolio";

export function renderAwardsSection(awards: PortfolioAwards): string {
  return `
    <section class="section section--awards" data-reveal>
      <div class="section-head">
        <p class="eyebrow">${esc(awards.subtitle)}</p>
      </div>
      <div class="awards-list">
        ${awards.awards.map((award) => `
          <article class="award-card glass-card">
            <div class="award-year">${esc(award.year)}</div>
            <div class="award-content">
              <h3 class="award-title">${esc(award.title)}</h3>
              <p class="award-org">${esc(award.organization)}</p>
              ${award.description ? `<p class="award-desc">${esc(award.description)}</p>` : ""}
            </div>
          </article>
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
