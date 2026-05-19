import { useState } from "react";
import type { Portfolio } from "../types/portfolio";

const LINKS = [
  { id: "about", label: "About" },
  { id: "studio", label: "Studio" },
  { id: "experience", label: "Experience" },
  { id: "posts", label: "Posts" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;

type SiteNavProps = {
  profile: Portfolio["profile"];
  activeId: string;
};

export function SiteNav({ profile, activeId }: SiteNavProps) {
  const [open, setOpen] = useState(false);

  const navigate = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <a
          href="#top"
          className="site-nav__brand"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            setOpen(false);
          }}
        >
          <span className="site-nav__brand-mark" aria-hidden />
          <span className="site-nav__brand-text">{profile.name}</span>
        </a>

        <nav className="site-nav__links" aria-label="Primary">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`site-nav__link ${activeId === link.id ? "site-nav__link--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(link.id);
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={profile.portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="site-nav__cta btn-cta btn-cta--pink"
        >
          chaosstudio.mv
        </a>

        <button
          type="button"
          className="site-nav__menu-btn"
          aria-expanded={open}
          aria-controls="site-nav-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className={`site-nav__burger ${open ? "site-nav__burger--open" : ""}`} aria-hidden />
        </button>
      </div>

      <div id="site-nav-drawer" className={`site-nav__drawer ${open ? "site-nav__drawer--open" : ""}`}>
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className={`site-nav__drawer-link ${activeId === link.id ? "site-nav__drawer-link--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(link.id);
            }}
          >
            {link.label}
          </a>
        ))}
        <a
          href={profile.portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="site-nav__drawer-cta btn-cta btn-cta--pink"
        >
          Visit chaosstudio.mv
        </a>
      </div>
    </header>
  );
}

export const SITE_SECTION_IDS = LINKS.map((l) => l.id);
