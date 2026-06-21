import type { Testimonial } from "../types/portfolio";

export function renderTestimonialsSection(testimonials: Testimonial[]): string {
  return `
    <section class="section section--testimonials" data-reveal>
      <div class="testimonials-grid">
        ${testimonials.map((testimonial) => `
          <article class="testimonial-card glass-card">
            <blockquote class="testimonial-quote">
              "${esc(testimonial.quote)}"
            </blockquote>
            <div class="testimonial-author">
              <div class="testimonial-name">${esc(testimonial.author)}</div>
              <div class="testimonial-title">${esc(testimonial.title)}</div>
              ${testimonial.contact ? `<div class="testimonial-contact">${esc(testimonial.contact)}</div>` : ""}
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
