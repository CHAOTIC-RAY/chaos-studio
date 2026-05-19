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
  if (id === "cookxpert") {
    return (
      <div className="cv-project__mock-wrapper cookxpert-mock">
        <div className="cv-project__mock-desktop" style={{ backgroundImage: "url(/images/projects/cookxpert_desktop.png)" }} />
        <div className="cv-project__mock-mobile" style={{ backgroundImage: "url(/images/projects/cookxpert_mobile.png)" }} />
      </div>
    );
  }
  if (id === "forge") {
    return (
      <div className="cv-project__mock-wrapper forge-mock">
        <div className="cv-project__mock-desktop" style={{ backgroundImage: "url(/images/projects/forge_desktop.png)" }} />
        <div className="cv-project__mock-mobile" style={{ backgroundImage: "url(/images/projects/forge_mobile.png)" }} />
      </div>
    );
  }
  return (
    <div className="cv-project__mock-wrapper faisa-mock">
      <div className="cv-project__mock-mobile-only" style={{ backgroundImage: "url(/images/projects/faisa_mobile.png)" }} />
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
