import type { ProcessStep } from "../types/portfolio";

export function renderProcessSteps(process: ProcessStep[]): string {
  return `
    <section class="section section--process" data-reveal>
      <div class="section-head">
        <p class="eyebrow">Our process</p>
      </div>
      <div class="process-steps">
        ${process.map((step) => `
          <div class="process-step glass-card" data-process-step>
            <div class="process-step-number">${esc(String(step.step))}</div>
            <div class="process-step-content">
              <h3 class="process-step-title">${esc(step.title)}</h3>
              <p class="process-step-desc">${esc(step.description)}</p>
            </div>
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
