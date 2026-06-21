import type { PortfolioNews } from "../types/portfolio";

export function renderNewsSection(news: PortfolioNews, showCount: number = 3): string {
  const itemsToShow = news.news.slice(0, showCount);
  return `
    <section class="section section--news" data-reveal>
      <div class="section-head">
        <p class="eyebrow">${esc(news.subtitle)}</p>
      </div>
      <div class="news-grid">
        ${itemsToShow.map((item) => `
          <article class="news-card glass-card">
            <div class="news-meta">
              <span class="news-category">${esc(item.category)}</span>
              <span class="news-date">${esc(item.date)}</span>
            </div>
            <h3 class="news-title">${esc(item.title)}</h3>
            <p class="news-excerpt">${esc(item.excerpt)}</p>
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
