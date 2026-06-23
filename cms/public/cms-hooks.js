/**
 * Shared Decap CMS hooks (login shell + editor iframe).
 */
(function () {
  function normalizeListValue(val, prop) {
    if (!Array.isArray(val)) return val;
    return val.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && prop in item) return String(item[prop]);
      return String(item ?? "");
    });
  }

  function normalizeEntry(entry) {
    if (!entry?.data) return entry;
    const d = entry.data;
    if (Array.isArray(d.posts)) {
      for (const p of d.posts) {
        if (p.tags) p.tags = normalizeListValue(p.tags, "tag");
        if (p.slides) p.slides = normalizeListValue(p.slides, "slide");
      }
    }
    if (d.softSkills) d.softSkills = normalizeListValue(d.softSkills, "skill");
    if (d.experience?.items) {
      for (const job of d.experience.items) {
        if (job.bullets) job.bullets = normalizeListValue(job.bullets, "bullet");
      }
    }
    if (d.featuredWork?.projects) {
      for (const proj of d.featuredWork.projects) {
        if (proj.highlights) proj.highlights = normalizeListValue(proj.highlights, "line");
        if (proj.tags) proj.tags = normalizeListValue(proj.tags, "tag");
      }
    }
    if (d.skills?.categories) {
      for (const cat of d.skills.categories) {
        if (cat.tools) cat.tools = normalizeListValue(cat.tools, "tool");
      }
    }
    if (d.highlights) d.highlights = normalizeListValue(d.highlights, "line");
    if (d.services) d.services = normalizeListValue(d.services, "service");
    if (d.packages) {
      for (const pkg of d.packages) {
        if (pkg.features) pkg.features = normalizeListValue(pkg.features, "feature");
      }
    }
    if (d.about?.skills) d.about.skills = normalizeListValue(d.about.skills, "skill");
    return entry;
  }

  function registerCmsHooks() {
    if (window.__chaosAppHooks || !window.CMS?.registerEventListener) return false;
    window.__chaosAppHooks = true;
    try {
      window.CMS.registerEventListener({
        name: "preSave",
        handler: ({ entry }) => {
          if (!entry?.get) return entry;
          const data = entry.get("data");
          if (!data?.toJS) return entry;
          const plain = data.toJS();
          normalizeEntry({ data: plain });
          const Map = data.constructor;
          if (Map?.fromJS) return entry.set("data", Map.fromJS(plain));
          return entry;
        },
      });
    } catch (e) {
      console.warn("[CMS] preSave hook skipped", e);
    }

    // Register visual builder preview
    if (window.CMS.registerPreviewTemplate) {
      const PagesPreview = window.createClass({
        render: function() {
          const entry = this.props.entry;
          const blocks = entry.getIn(['data', 'blocks']) || [];
          
          const renderBlock = (block, index) => {
            if (!block) return null;
            const type = block.get('type');
            if (type === 'hero') {
              return window.h('div', { key: index, style: { padding: '40px', background: '#111', color: '#fff', borderRadius: '12px', marginBottom: '20px' } },
                window.h('h2', { style: { fontSize: '2.5rem', marginBottom: '10px'} }, block.get('headline')),
                window.h('p', { style: { fontSize: '1.2rem', opacity: 0.8} }, block.get('subheadline')),
                block.get('image') ? window.h('img', { src: this.props.getAsset(block.get('image')), style: { marginTop: '20px', maxWidth: '100%', borderRadius: '8px' } }) : null
              );
            }
            if (type === 'text') {
              return window.h('div', { key: index, style: { padding: '20px', color: '#ccc' } }, 
                window.h('div', { dangerouslySetInnerHTML: { __html: this.props.widgetFor('body') } })
              );
            }
            if (type === 'gallery') {
              const images = block.get('images') || [];
              return window.h('div', { key: index, style: { padding: '20px' } }, 
                 window.h('h3', { style: { color: '#fff' } }, block.get('title')),
                 window.h('div', { style: { display: 'flex', gap: '10px', overflowX: 'auto' } }, 
                   images.map((img, i) => window.h('img', { src: this.props.getAsset(img.get('image')), style: { height: '150px', borderRadius: '8px' }, key: i }))
                 )
              );
            }
            return window.h('div', { key: index }, `[Block: ${type}]`);
          };

          return window.h('div', { style: { fontFamily: 'sans-serif', padding: '20px' } },
            window.h('h1', { style: { borderBottom: '1px solid #333', paddingBottom: '10px', color: '#fff' } }, entry.getIn(['data', 'title']) || 'Untitled Page'),
            blocks.map((b, i) => renderBlock(b, i))
          );
        }
      });
      window.CMS.registerPreviewTemplate('pages', PagesPreview);
    }

    return true;
  }

  function boot() {
    if (registerCmsHooks()) return;
    let attempts = 0;
    const poll = setInterval(() => {
      attempts += 1;
      if (registerCmsHooks() || attempts >= 50) clearInterval(poll);
    }, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("load", boot);
})();
