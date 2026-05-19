function marqueeGroup(content: string): string {
  return `<span class="work-marquee__group">${content}</span>`;
}

function marqueeRow(content: string, velocity: number, mod: string): string {
  const duplicated = marqueeGroup(content) + marqueeGroup(content);
  return `
    <div class="work-marquee__row work-marquee__row--${mod}" data-marquee-velocity="${velocity}">
      <div class="work-marquee__track">
        <div class="work-marquee__inner">${duplicated}</div>
      </div>
    </div>
  `;
}

export function renderWorkMarquee(): string {
  const row1 = `
    <span class="work-marquee__grad">Rainbow Enterprise</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__grad work-marquee__grad--alt">Reach MV</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__muted">Branding</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__grad work-marquee__grad--alt">Haus of Paws</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__muted">Social Media</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
  `;

  const row2 = `
    <span class="work-marquee__solid">Islanders</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__accent">Nutrition</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__solid">Digital Dive</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__accent">Motion Graphics</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__solid">Unicare</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
  `;

  const row3 = `
    <span class="work-marquee__grad work-marquee__grad--gray">Logo Design</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__fuchsia">Strategy</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__grad work-marquee__grad--gray">Marketing</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
    <span class="work-marquee__fuchsia">Content</span>
    <span class="work-marquee__sep" aria-hidden="true">•</span>
  `;

  return `
    <div class="work-marquee work-marquee--hero" role="region" aria-label="Selected clients and services">
      ${marqueeRow(row1, -2, "a")}
      ${marqueeRow(row2, 2, "b")}
      ${marqueeRow(row3, -1.5, "c")}
    </div>
  `;
}
