import { useState } from "react";
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

const toolColors: Record<string, string> = {
  Photoshop: "#31a8ff",
  Illustrator: "#ff9a00",
  Lightroom: "#31a8ff",
  InDesign: "#ff3366",
  "Premiere Pro": "#9999ff",
  "After Effects": "#9999ff",
  PowerPoint: "#d35230",
  Word: "#2b579a",
  Excel: "#217346",
  "Adobe XD": "#ff61f6",
  Figma: "#a259ff",
  Dreamweaver: "#ff61f6",
};

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
      <GlassCard className="cv-top__objective" variants={fadeUp}>
        <h2>{data.objective.title}</h2>
        <p>{data.objective.body}</p>
      </GlassCard>

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

function Experience({ data }: { data: Portfolio["experience"] }) {
  return (
    <>
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
            className="cv-exp-card"
            featured={job.featured}
            variants={fadeUp}
            whileHover={{ y: -4 }}
          >
            <div className="cv-exp-card__head">
              <div className="cv-exp-card__logo">{job.logo}</div>
              <div className="cv-exp-card__title">
                <p className="cv-exp-card__company">{job.company}</p>
                <p className="cv-exp-card__role">{job.role}</p>
              </div>
              <span className={job.featured ? "date-pill" : "date-pill date-pill--muted"}>
                {job.period}
              </span>
            </div>
            {job.description && <p className="cv-exp-card__desc">{job.description}</p>}
          </GlassCard>
        ))}
      </motion.div>

      <motion.div
        className="cv-exp-details"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-20px" }}
        variants={stagger}
      >
        {data.items.map((job) => (
          <GlassCard key={`${job.id}-detail`} className="cv-exp-detail" variants={fadeUp}>
            <div className="cv-exp-detail__head">
              <span className="cv-exp-detail__logo">{job.logo}</span>
              <div>
                <h3>{job.company}</h3>
                <p>{job.role}</p>
              </div>
              <span className="date-pill date-pill--muted">{job.period}</span>
            </div>
            {job.description && <p className="cv-exp-detail__summary">{job.description}</p>}
            {job.bullets && (
              <ul className="cv-exp-detail__bullets">
                {job.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </GlassCard>
        ))}
      </motion.div>
    </>
  );
}

function SocialPosts({ data }: { data: Portfolio["socialPosts"] }) {
  return (
    <motion.div
        className="cv-posts"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-20px" }}
        variants={stagger}
      >
        {data.items.map((post) => (
          <GlassCard
            key={post.id}
            className={`cv-post ${postAccentClass[post.accent] ?? "cv-post--purple"}`}
            variants={fadeUp}
          >
            <div className="cv-post__meta">
              <span className="cv-post__platform">{post.platform}</span>
              <span className="cv-post__client">{post.client}</span>
            </div>
            <h3 className="cv-post__title">{post.title}</h3>
            <p className="cv-post__desc">{post.description}</p>
            <div className="cv-post__tags">
              {post.tags.map((tag) => (
                <span key={tag} className="pill pill--outline">
                  {tag}
                </span>
              ))}
            </div>
          </GlassCard>
        ))}
    </motion.div>
  );
}

function ProjectMock({ id }: { id: string }) {
  const [hasDesktop, setHasDesktop] = useState(true);
  const [hasMobile, setHasMobile] = useState(true);

  const getFallbackStyle = () => {
    if (id === "cookxpert") {
      return {
        background:
          "radial-gradient(circle at 30% 40%, rgba(255,150,210,0.35), transparent 50%), radial-gradient(circle at 70% 60%, rgba(213,119,237,0.25), transparent 45%)",
      };
    }
    if (id === "forge") {
      return {
        background:
          "linear-gradient(90deg, transparent 48%, rgba(255,255,255,0.06) 50%, transparent 52%), linear-gradient(180deg, #2a1f30, #151515)",
        backgroundSize: "24px 100%, 100% 100%",
      };
    }
    return {
      background:
        "linear-gradient(160deg, rgba(189,244,79,0.15), transparent 40%), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 12px)",
    };
  };

  const isOnlyMobile = id === "faisa" || id === "faisamobile";

  return (
    <div className="cv-project__mock-container" style={getFallbackStyle()}>
      <div className="cv-project__mock-grid-overlay" />
      {isOnlyMobile ? (
        <div className="cv-project__mock-single-mobile">
          {hasMobile && (
            <img
              src={`/images/projects/${id}_mobile.png`}
              alt={`${id} Mobile interface`}
              onError={() => setHasMobile(false)}
            />
          )}
        </div>
      ) : (
        <div className="cv-project__mock-split">
          {hasDesktop && (
            <img
              className="cv-project__mock-desktop-img"
              src={`/images/projects/${id}_desktop.png`}
              alt={`${id} Desktop UI`}
              onError={() => setHasDesktop(false)}
            />
          )}
          {hasMobile && (
            <img
              className="cv-project__mock-mobile-img"
              src={`/images/projects/${id}_mobile.png`}
              alt={`${id} Mobile UI`}
              onError={() => setHasMobile(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FeaturedWork({ data }: { data: Portfolio["featuredWork"] }) {
  const tagClasses = ["tag--pink", "tag--gold", "tag--blue", "tag--teal", "tag--orange", "tag--red"];

  return (
    <>
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
            {project.tags && (
              <div className="cv-project__tags">
                {project.tags.map((tag, i) => (
                  <span key={tag} className={`tag ${tagClasses[i % tagClasses.length]}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="cv-project__footer">
              <div className="cv-project__info">
                <h3>{project.name}</h3>
                <p>{project.tagline}</p>
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
          </GlassCard>
        ))}
      </motion.div>

      <motion.div
        className="cv-project-details"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-20px" }}
        variants={stagger}
      >
        {data.projects.map((project) => (
          <GlassCard key={`${project.id}-detail`} className="cv-project-detail" variants={fadeUp}>
            <div className="cv-project-detail__head">
              <h3>{project.name}</h3>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-cta ${project.accent === "pink" ? "btn-cta--pink" : "btn-cta--white"}`}
              >
                {project.cta}
              </a>
            </div>
            {project.description && <p className="cv-project-detail__desc">{project.description}</p>}
            {project.highlights && (
              <ul className="cv-project-detail__list">
                {project.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </GlassCard>
        ))}
      </motion.div>
    </>
  );
}

function ToolIcon({ tool }: { tool: string }) {
  if (tool === "Figma") {
    return (
      <span className="cv-tool-icon cv-tool-icon--figma" title="Figma" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
        <svg viewBox="0 0 38 57" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 0C8.5 0 0 8.5 0 19c0 5.4 2.2 10.2 5.8 13.7C2.2 36.2 0 41 0 46.5c0 5.8 4.7 10.5 10.5 10.5h8.5c5.8 0 10.5-4.7 10.5-10.5V38h8.5c5.8 0 10.5-4.7 10.5-10.5 0-5.4-2.2-10.2-5.8-13.7C42.2 10.2 40 5.4 34.5 2.1c-4.4-2.6-10-2.6-15.5-2.1z" fill="#0acf83"/>
          <path d="M0 19c0-10.5 8.5-19 19-19h9.5v19H19C13.5 19 9 14.5 9 9z" fill="#f24e1e"/>
          <path d="M0 28.5c0-10.5 8.5-19 19-19v38H19c-10.5 0-19-8.5-19-19z" fill="#a259ff"/>
          <path d="M19 28.5c10.5 0 19 8.5 19 19s-8.5 19-19 19c-10.5 0-19-8.5-19-19z" fill="#1abc9c"/>
          <path d="M38 19c0 10.5-8.5 19-19 19v-38c10.5 0 19 8.5 19 19z" fill="#ff7262"/>
        </svg>
      </span>
    );
  }

  const adobeConfigs: Record<string, { bg: string; border: string; text: string; label: string }> = {
    Photoshop: { bg: "#001c3a", border: "#00c8ff", text: "#00c8ff", label: "Ps" },
    Illustrator: { bg: "#331c00", border: "#ff9a00", text: "#ff9a00", label: "Ai" },
    Lightroom: { bg: "#001f2b", border: "#31a8ff", text: "#31a8ff", label: "Lr" },
    InDesign: { bg: "#2e0014", border: "#ff3366", text: "#ff3366", label: "Id" },
    "Premiere Pro": { bg: "#110022", border: "#9999ff", text: "#9999ff", label: "Pr" },
    "After Effects": { bg: "#16002e", border: "#9999ff", text: "#9999ff", label: "Ae" },
    "Adobe XD": { bg: "#2e0027", border: "#ff61f6", text: "#ff61f6", label: "Xd" },
    Dreamweaver: { bg: "#212100", border: "#ff61f6", text: "#ff61f6", label: "Dw" },
  };

  const msConfigs: Record<string, { bg: string; border: string; text: string; label: string }> = {
    PowerPoint: { bg: "#3d1308", border: "#d35230", text: "#d35230", label: "Pp" },
    Word: { bg: "#0a1c3a", border: "#2b579a", text: "#2b579a", label: "Wd" },
    Excel: { bg: "#092815", border: "#217346", text: "#217346", label: "Xl" },
  };

  const conf = adobeConfigs[tool] || msConfigs[tool];

  if (conf) {
    return (
      <span
        className="cv-tool-icon"
        title={tool}
        style={{
          background: conf.bg,
          border: `1.5px solid ${conf.border}`,
          boxShadow: `0 0 10px ${conf.border}66`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <span style={{ color: conf.text, fontSize: "9px", fontWeight: "800", fontFamily: "sans-serif" }}>
          {conf.label}
        </span>
      </span>
    );
  }

  return (
    <span
      className="cv-tool-icon"
      title={tool}
      style={{ background: "#555", border: "1px solid #777" }}
    >
      {tool.slice(0, 2)}
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
