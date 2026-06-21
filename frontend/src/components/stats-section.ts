import type { PortfolioStats } from "../types/portfolio";

export function renderStatsSection(stats: PortfolioStats): string {
  return `
    <section class="section section--stats" data-reveal>
      <div class="section-head">
        <p class="eyebrow">${esc(stats.subtitle)}</p>
      </div>
      <div class="stats-grid">
        ${stats.stats.map((stat) => `
          <div class="stat-card glass-card" data-stat-card>
            <div class="stat-value" data-count-up="${esc(stat.value)}">${esc(stat.value)}</div>
            <div class="stat-label">${esc(stat.label)}</div>
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
