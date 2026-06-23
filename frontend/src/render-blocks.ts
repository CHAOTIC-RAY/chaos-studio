export function renderDynamicBlocks(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";

  return blocks.map((block) => {
    switch (block.type) {
      case "hero":
        return `
          <section class="section hero">
            <h1 class="hero__title">${block.headline}</h1>
            <p class="hero__subtitle">${block.subheadline}</p>
            ${block.image ? `<img src="${block.image}" alt="Hero Image" class="hero__image"/>` : ""}
          </section>
        `;
      case "text":
        return `
          <section class="section text-content">
            <div class="prose">${block.body}</div>
          </section>
        `;
      case "gallery":
        return `
          <section class="section gallery">
            ${block.title ? `<h2 class="section-title">${block.title}</h2>` : ""}
            <div class="gallery-grid">
              ${block.images?.map((img: any) => `
                <div class="gallery-item">
                  <img src="${img.image}" alt="${img.caption || ''}"/>
                  ${img.caption ? `<p class="caption">${img.caption}</p>` : ""}
                </div>
              `).join("") || ""}
            </div>
          </section>
        `;
      case "social_feed":
        return `
          <section class="section social-feed">
            ${block.subtitle ? `<h2 class="section-title">${block.subtitle}</h2>` : ""}
            <div class="social-grid">
              ${block.posts?.map((post: any) => `
                <article class="post-card post-card--${post.accent || 'purple'}">
                  <h3>${post.title}</h3>
                  <p>${post.client} - ${post.platform}</p>
                </article>
              `).join("") || ""}
            </div>
          </section>
        `;
      case "testimonials":
        return `
          <section class="section testimonials">
            ${block.title ? `<h2 class="section-title">${block.title}</h2>` : ""}
            <div class="testimonials-grid">
              ${block.items?.map((item: any) => `
                <blockquote class="testimonial">
                  <p>"${item.quote}"</p>
                  <footer>
                    ${item.avatar ? `<img src="${item.avatar}" class="avatar"/>` : ""}
                    <cite>${item.author} ${item.role ? `<span>- ${item.role}</span>` : ""}</cite>
                  </footer>
                </blockquote>
              `).join("") || ""}
            </div>
          </section>
        `;
      case "pricing":
        return `
          <section class="section pricing">
            ${block.title ? `<h2 class="section-title">${block.title}</h2>` : ""}
            <div class="pricing-grid">
              ${block.plans?.map((plan: any) => `
                <div class="pricing-card">
                  <h3>${plan.name}</h3>
                  <div class="price">${plan.price}</div>
                  <p>${plan.description || ""}</p>
                  <ul>
                    ${plan.features?.map((f: any) => `<li>${f.feature}</li>`).join("") || ""}
                  </ul>
                  ${plan.cta ? `<button class="btn">${plan.cta}</button>` : ""}
                </div>
              `).join("") || ""}
            </div>
          </section>
        `;
      case "contact":
        return `
          <section class="section contact">
            <h2 class="section-title">${block.title}</h2>
            <p>${block.subtitle || ""}</p>
            <form class="contact-form" action="mailto:${block.email}">
              <input type="text" placeholder="Name" required/>
              <input type="email" placeholder="Email" required/>
              <textarea placeholder="Message" required></textarea>
              <button class="btn btn--primary" type="submit">Send Message</button>
            </form>
          </section>
        `;
      default:
        return `<div class="unknown-block">Unknown block type: ${block.type}</div>`;
    }
  }).join("");
}
