import { ReactNode } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./components/GlassCard";
import { SiteHero } from "./components/SiteHero";
import { SITE_SECTION_IDS, SiteNav } from "./components/SiteNav";
import { SiteSection } from "./components/SiteSection";
import { useActiveSection } from "./hooks/useActiveSection";
import { usePortfolio } from "./hooks/usePortfolio";
import type { Portfolio } from "./types/portfolio";
import { fadeUp, stagger } from "./components/motion";
import "./App.css";


const postAccentClass: Record<string, string> = {
  purple: "cv-post--purple",
  pink: "cv-post--pink",
  gold: "cv-post--gold",
  teal: "cv-post--teal",
};

function TopRow({ data }: { data: Portfolio }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.profile.portfolioUrl)}`;

  return (
    <motion.section
      className="cv-top"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
      variants={stagger}
    >
      <div className="cv-top__left">
        <GlassCard className="cv-top__objective" variants={fadeUp}>
          <h2>{data.objective.title}</h2>
          <p>{data.objective.body}</p>
        </GlassCard>

        <div className="cv-top__skills-interests">
          <GlassCard className="cv-top__card" variants={fadeUp}>
            <h2>Soft Skills</h2>
            <motion.div className="cv-top__pills" variants={stagger}>
              {data.softSkills.map((skill) => (
                <motion.span key={skill} className="pill" variants={fadeUp}>
                  {skill}
                </motion.span>
              ))}
            </motion.div>
          </GlassCard>

          <GlassCard className="cv-top__card" variants={fadeUp}>
            <h2>Interests</h2>
            <motion.div className="cv-top__pills" variants={stagger}>
              {data.interests.map((item) => (
                <motion.span key={item.label} className="pill pill--outline" variants={fadeUp}>
                  <span aria-hidden>{item.emoji}</span> {item.label}
                </motion.span>
              ))}
            </motion.div>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="cv-portfolio cv-top__portfolio" variants={fadeUp}>
        <span className="cv-portfolio__label">Portfolio</span>
        <a
          href={data.profile.portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cv-portfolio__qr"
          aria-label="Open portfolio QR code link"
        >
          <img src={qrUrl} alt="Portfolio QR code" width={99} height={99} />
        </a>
      </GlassCard>
    </motion.section>
  );
}

function ChaosStudio({ data }: { data: Portfolio["chaosStudio"] }) {
  return (
    <GlassCard className="cv-chaos" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
      <p className="cv-chaos__desc">{data.description}</p>
      <ul className="cv-chaos__list">
        {data.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </GlassCard>
  );
}

const businessLogos: Record<string, ReactNode> = {
  rainbow: (
    <svg viewBox="0 0 40 40" className="biz-logo biz-logo--rainbow" width="32" height="32" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d577ed" />
          <stop offset="100%" stopColor="#a848c6" />
        </linearGradient>
      </defs>
      <path d="M8 26 A 12 12 0 0 1 32 26" fill="none" stroke="url(#rainbow-grad)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M13 26 A 7 7 0 0 1 27 26" fill="none" stroke="url(#rainbow-grad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 26 H26 V31 H14 Z" fill="rgba(213, 119, 237, 0.15)" stroke="url(#rainbow-grad)" strokeWidth="1" />
    </svg>
  ),
  polytechnic: (
    <svg viewBox="0 0 40 40" className="biz-logo biz-logo--poly" width="32" height="32" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="poly-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#d5a007" />
        </linearGradient>
      </defs>
      <path d="M20 5 L34 12 V24 C34 31 28 35 20 37 C12 35 6 31 6 24 V12 Z" fill="rgba(255,215,0,0.06)" stroke="url(#poly-grad)" strokeWidth="1.8" />
      <path d="M12 21 C15 19 20 21 20 21 C20 21 25 19 28 21 V15 C25 13 20 15 20 15 C20 15 15 13 12 15 Z" fill="none" stroke="url(#poly-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="20" y1="15" x2="20" y2="21" stroke="url(#poly-grad)" strokeWidth="1.5" />
    </svg>
  ),
  ayha: (
    <svg viewBox="0 0 40 40" className="biz-logo biz-logo--ayha" width="32" height="32" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="ayha-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00c6ff" />
          <stop offset="100%" stopColor="#0072ff" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="15" fill="rgba(0,198,255,0.04)" stroke="url(#ayha-grad)" strokeWidth="1.8" />
      <path d="M11 23 C14 19 16 25 20 21 C24 17 26 23 29 19" fill="none" stroke="url(#ayha-grad)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 18 C16 14 18 20 22 16 C26 12 28 18 29 14" fill="none" stroke="url(#ayha-grad)" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
    </svg>
  ),
};

function Experience({ data }: { data: Portfolio["experience"] }) {
  return (
    <motion.div
      className="cv-experience"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={stagger}
    >
      {data.items.map((job) => (
        <GlassCard
          key={job.id}
          className={`cv-exp-card ${job.featured ? "cv-exp-card--featured" : ""}`}
          featured={job.featured}
          variants={fadeUp}
          whileHover={{ y: -4 }}
        >
          <div className="cv-exp-card__head">
            <div className="cv-exp-card__logo-container">
              {businessLogos[job.id] || <span className="cv-exp-card__logo-fallback">{job.logo}</span>}
            </div>
            <div className="cv-exp-card__title">
              <h3 className="cv-exp-card__company">{job.company}</h3>
              <p className="cv-exp-card__role">{job.role}</p>
            </div>
            <span className={job.featured ? "date-pill" : "date-pill date-pill--muted"}>
              {job.period}
            </span>
          </div>
          {job.description && <p className="cv-exp-card__desc">{job.description}</p>}
          {job.bullets && (
            <ul className="cv-exp-card__bullets">
              {job.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </GlassCard>
      ))}
    </motion.div>
  );
}

function SocialPosts({ data }: { data: Portfolio["socialPosts"] }) {
  // Duplicate list to ensure seamless infinite looping scroll
  const doubleItems = [...data.items, ...data.items];

  return (
    <div className="cv-posts-carousel-viewport">
      <div className="cv-posts-carousel-track">
        {doubleItems.map((post, idx) => (
          <GlassCard
            key={`${post.id}-${idx}`}
            className={`cv-post-card ${postAccentClass[post.accent] ?? "cv-post-card--purple"}`}
          >
            <div 
              className={`cv-post-card__img-box cv-post-card__img-box--${post.accent}`}
              style={{ backgroundImage: `url(/images/posts/${post.id}.png)` }}
            >
              <div className="cv-post-card__img-overlay">
                <span className="cv-post-card__img-platform">{post.platform}</span>
                <div className="cv-post-card__img-body">
                  <p className="cv-post-card__img-client">{post.client}</p>
                  <p className="cv-post-card__img-title">{post.title}</p>
                </div>
              </div>
            </div>
            
            <div className="cv-post-card__content">
              <div className="cv-post-card__meta">
                <span className="cv-post-card__platform">{post.platform}</span>
                <span className="cv-post-card__client">{post.client}</span>
              </div>
              <h3 className="cv-post-card__title">{post.title}</h3>
              <p className="cv-post-card__desc">{post.description}</p>
              <div className="cv-post-card__tags">
                {post.tags.map((tag) => (
                  <span key={tag} className="pill pill--outline">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function ProjectMock({ id }: { id: string }) {
  const desktopVideo = `/videos/projects/${id}_desktop.mp4`;
  const mobileVideo = `/videos/projects/${id}_mobile.mp4`;

  if (id === "cookxpert") {
    return (
      <div className="cv-project__mock-wrapper cookxpert-mock">
        <div className="cv-project__mock-desktop" style={{ backgroundImage: "url(/images/projects/cookxpert_desktop.png)" }}>
          <video src={desktopVideo} autoPlay loop muted playsInline onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="cv-project__mock-mobile" style={{ backgroundImage: "url(/images/projects/cookxpert_mobile.png)" }}>
          <video src={mobileVideo} autoPlay loop muted playsInline onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
      </div>
    );
  }
  if (id === "forge") {
    return (
      <div className="cv-project__mock-wrapper forge-mock">
        <div className="cv-project__mock-desktop" style={{ backgroundImage: "url(/images/projects/forge_desktop.png)" }}>
          <video src={desktopVideo} autoPlay loop muted playsInline onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="cv-project__mock-mobile" style={{ backgroundImage: "url(/images/projects/forge_mobile.png)" }}>
          <video src={mobileVideo} autoPlay loop muted playsInline onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
      </div>
    );
  }
  return (
    <div className="cv-project__mock-wrapper faisa-mock">
      <div className="cv-project__mock-mobile-only" style={{ backgroundImage: "url(/images/projects/faisa_mobile.png)" }}>
        <video src={mobileVideo} autoPlay loop muted playsInline onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </div>
    </div>
  );
}

function FeaturedWork({ data }: { data: Portfolio["featuredWork"] }) {
  const tagClasses = ["tag--pink", "tag--gold", "tag--blue", "tag--teal", "tag--orange", "tag--red"];

  return (
    <motion.div
      className="cv-projects"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={stagger}
    >
      {data.projects.map((project) => (
        <GlassCard
          key={project.id}
          className={`cv-project cv-project--${project.id}`}
          variants={fadeUp}
          whileHover={{ y: -4, scale: 1.01 }}
        >
          <span className="cv-project__badge">Recent Work</span>
          <div className="cv-project__preview">
            <ProjectMock id={project.id} />
          </div>
          
          <div className="cv-project__body">
            <div className="cv-project__meta-row">
              <div className="cv-project__title-grp">
                <h3>{project.name}</h3>
                <p className="cv-project__tagline">{project.tagline}</p>
              </div>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-cta ${project.accent === "pink" ? "btn-cta--pink" : "btn-cta--white"}`}
              >
                {project.cta}
              </a>
            </div>
            
            {project.description && <p className="cv-project__desc">{project.description}</p>}
            
            {project.highlights && (
              <ul className="cv-project__highlights">
                {project.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          
          {project.tags && (
            <div className="cv-project__tags">
              {project.tags.map((tag, i) => (
                <span key={tag} className={`tag ${tagClasses[i % tagClasses.length]}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </GlassCard>
      ))}
    </motion.div>
  );
}

function ToolIcon({ tool }: { tool: string }) {
  const toolClass = tool.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const label = tool === "Figma" ? "Fi" : tool.slice(0, 2);

  return (
    <span className={`cv-tool-icon tool-${toolClass}`} title={tool}>
      {label}
    </span>
  );
}

function SkillsEducation({
  skills,
  education,
}: {
  skills: Portfolio["skills"];
  education: Portfolio["education"];
}) {
  return (
    <div className="cv-skills-edu">
      <div className="cv-skills-edu__col">
        <motion.div
          className="cv-skills__grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
        >
          {skills.categories.map((cat) => (
            <GlassCard
              key={cat.title}
              className={`cv-skill-card cv-skill-card--${cat.variant}`}
              featured={cat.variant === "primary"}
              variants={fadeUp}
              whileHover={{ y: -3 }}
            >
              <h3>{cat.title}</h3>
              {cat.description && <p>{cat.description}</p>}
              <div className="cv-skill-card__tools">
                {cat.tools.map((tool) => (
                  <ToolIcon key={tool} tool={tool} />
                ))}
              </div>
            </GlassCard>
          ))}
        </motion.div>
      </div>

      <div className="cv-skills-edu__col">
        <h3 className="cv-skills-edu__subhead">Education</h3>
        <motion.div
          className="cv-edu-list"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
        >
          {education.map((item) => (
            <GlassCard key={item.degree} className="cv-edu-item" variants={fadeUp}>
              <h3>{item.degree}</h3>
              <p className="school">{item.school}</p>
              {item.detail && <p className="detail">{item.detail}</p>}
              <span className="period">{item.period}</span>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function ContactBar({ contact }: { contact: Portfolio["contact"] }) {
  return (
    <motion.footer
      className="cv-contact"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={stagger}
    >
      <svg className="cv-contact__logo" viewBox="0 0 34 46" fill="none" aria-hidden>
        <path
          d="M17 2C8 8 2 18 2 28c0 8 6 14 15 16 9-2 15-8 15-16 0-10-6-20-15-26z"
          fill="#f0f0f0"
        />
        <circle cx="12" cy="22" r="2" fill="#2d2d2d" />
        <circle cx="22" cy="22" r="2" fill="#2d2d2d" />
      </svg>

      <motion.a variants={fadeUp} className="cv-contact__chip" href={`mailto:${contact.email}`}>
        <span className="cv-contact__icon" aria-hidden>
          ✉
        </span>
        {contact.email}
      </motion.a>

      <motion.a variants={fadeUp} className="cv-contact__chip" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
        <span className="cv-contact__icon" aria-hidden>
          ☎
        </span>
        {contact.phone}
      </motion.a>

      <motion.a
        variants={fadeUp}
        className="cv-contact__chip"
        href={contact.telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram"
      >
        <span className="cv-contact__icon" aria-hidden>
          ✈
        </span>
        Telegram
      </motion.a>

      <motion.a
        variants={fadeUp}
        className="cv-contact__chip"
        href={contact.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <span className="cv-contact__icon" aria-hidden>
          ◉
        </span>
        WhatsApp
      </motion.a>

      <motion.a
        variants={fadeUp}
        className="cv-contact__chip"
        href={contact.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="cv-contact__icon" aria-hidden>
          ◎
        </span>
        {contact.instagram}
      </motion.a>
    </motion.footer>
  );
}

export default function App() {
  const { data, loading, error } = usePortfolio();
  const activeId = useActiveSection([...SITE_SECTION_IDS]);

  if (loading) return <div className="loading">Loading portfolio…</div>;
  if (!data) return <div className="error">{error ?? "Something went wrong"}</div>;

  return (
    <div className="page">
      <div className="page__glow" aria-hidden />
      <div className="page__glow page__glow--left" aria-hidden />
      <div className="page__glow page__glow--center" aria-hidden />

      <SiteNav profile={data.profile} activeId={activeId} />

      <main className="site-main">
        <SiteHero profile={data.profile} objective={data.objective} />

        <div className="site-main__content">
          <SiteSection id="about" title="About" subtitle="Objective, skills and interests">
            <TopRow data={data} />
          </SiteSection>

          <SiteSection id="studio" title={data.chaosStudio.title} subtitle={data.chaosStudio.tagline}>
            <ChaosStudio data={data.chaosStudio} />
          </SiteSection>

          <SiteSection id="experience" title="Experience" subtitle={data.experience.subtitle}>
            <Experience data={data.experience} />
          </SiteSection>

          <SiteSection id="posts" title="Selected Posts" subtitle={data.socialPosts.subtitle}>
            <SocialPosts data={data.socialPosts} />
          </SiteSection>

          <SiteSection id="work" title="Featured Work" subtitle={data.featuredWork.subtitle}>
            <FeaturedWork data={data.featuredWork} />
          </SiteSection>

          <SiteSection id="skills" title="Skills and Education" subtitle={data.skills.subtitle}>
            <SkillsEducation skills={data.skills} education={data.education} />
          </SiteSection>

          <SiteSection id="contact" title="Contact" subtitle="Let's work together">
            <ContactBar contact={data.contact} />
          </SiteSection>

          {error && <p className="site-banner-error">Using cached content ({error})</p>}
        </div>

        <footer className="site-footer">
          <p>
            © {new Date().getFullYear()} {data.profile.name} · {data.profile.role}
          </p>
          <a href={data.profile.portfolioUrl} target="_blank" rel="noopener noreferrer">
            chaosstudio.mv
          </a>
        </footer>
      </main>
    </div>
  );
}
