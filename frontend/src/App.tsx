import { motion } from "framer-motion";
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

function Header({ profile }: { profile: Portfolio["profile"] }) {
  return (
    <motion.header
      className="cv-header"
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <h1 className="cv-header__name">{profile.name}</h1>
      <motion.div className="cv-header__meta" variants={stagger}>
        <motion.span variants={fadeUp}>{profile.tagline}</motion.span>
        <motion.span variants={fadeUp}>{profile.role}</motion.span>
      </motion.div>
    </motion.header>
  );
}

function TopRow({ data }: { data: Portfolio }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.profile.portfolioUrl)}`;

  return (
    <motion.section
      className="cv-top"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={stagger}
    >
      <motion.article className="glass-card cv-top__objective" variants={fadeUp}>
        <h2>{data.objective.title}</h2>
        <p>{data.objective.body}</p>
      </motion.article>

      <motion.article className="glass-card cv-top__card" variants={fadeUp}>
        <h2>Soft Skills</h2>
        <motion.div className="cv-top__pills" variants={stagger}>
          {data.softSkills.map((skill) => (
            <motion.span key={skill} className="pill" variants={fadeUp}>
              {skill}
            </motion.span>
          ))}
        </motion.div>
      </motion.article>

      <motion.article className="glass-card cv-top__card" variants={fadeUp}>
        <h2>Interests</h2>
        <motion.div className="cv-top__pills" variants={stagger}>
          {data.interests.map((item) => (
            <motion.span key={item.label} className="pill pill--outline" variants={fadeUp}>
              <span aria-hidden>{item.emoji}</span> {item.label}
            </motion.span>
          ))}
        </motion.div>
      </motion.article>

      <motion.article
        className="glass-card cv-portfolio cv-top__portfolio"
        variants={fadeUp}
      >
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
      </motion.article>
    </motion.section>
  );
}

function Experience({ data }: { data: Portfolio["experience"] }) {
  return (
    <section>
      <div className="cv-section-head">
        <h2 className="section-title">Experience</h2>
        <p className="section-subtitle">{data.subtitle}</p>
      </div>
      <motion.div
        className="cv-experience"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={stagger}
      >
        {data.items.map((job) => (
          <motion.article
            key={job.id}
            className={`glass-card cv-exp-card ${job.featured ? "glass-card--featured" : ""}`}
            variants={fadeUp}
            whileHover={{ y: -4 }}
          >
            <motion.div className="cv-exp-card__head">
              <div className="cv-exp-card__logo">{job.logo}</div>
              <div className="cv-exp-card__title">
                <p className="cv-exp-card__company">{job.company}</p>
                <p className="cv-exp-card__role">{job.role}</p>
              </div>
              <span className={job.featured ? "date-pill" : "date-pill date-pill--muted"}>
                {job.period}
              </span>
            </motion.div>
            {job.description && <p className="cv-exp-card__desc">{job.description}</p>}
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

function ProjectMock({ id }: { id: string }) {
  if (id === "cookxpert") {
    return (
      <motion.div
        className="cv-project__mock"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(255,150,210,0.35), transparent 50%), radial-gradient(circle at 70% 60%, rgba(213,119,237,0.25), transparent 45%)",
        }}
      />
    );
  }
  if (id === "forge") {
    return (
      <div
        className="cv-project__mock"
        style={{
          background:
            "linear-gradient(90deg, transparent 48%, rgba(255,255,255,0.06) 50%, transparent 52%), linear-gradient(180deg, #2a1f30, #151515)",
          backgroundSize: "24px 100%, 100% 100%",
        }}
      />
    );
  }
  return (
    <div
      className="cv-project__mock"
      style={{
        background:
          "linear-gradient(160deg, rgba(189,244,79,0.15), transparent 40%), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 12px)",
      }}
    />
  );
}

function FeaturedWork({ data }: { data: Portfolio["featuredWork"] }) {
  const tagClasses = ["tag--pink", "tag--gold", "tag--blue", "tag--teal", "tag--orange", "tag--red"];

  return (
    <section>
      <div className="cv-section-head">
        <h2 className="section-title">Featured Work</h2>
        <p className="section-subtitle">{data.subtitle}</p>
      </div>
      <motion.div
        className="cv-projects"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={stagger}
      >
        {data.projects.map((project) => (
          <motion.article
            key={project.id}
            className={`glass-card cv-project cv-project--${project.id}`}
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
          </motion.article>
        ))}
      </motion.div>
    </section>
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
      <section>
        <motion.div
          className="cv-section-head"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="section-title">Skills</h2>
          <p className="section-subtitle">{skills.subtitle}</p>
        </motion.div>
        <motion.div
          className="cv-skills__grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
        >
          {skills.categories.map((cat) => (
            <motion.article
              key={cat.title}
              className={`glass-card cv-skill-card cv-skill-card--${cat.variant}`}
              variants={fadeUp}
              whileHover={{ y: -3 }}
            >
              <h3>{cat.title}</h3>
              {cat.description && <p>{cat.description}</p>}
              <div className="cv-skill-card__tools">
                {cat.tools.map((tool) => (
                  <span
                    key={tool}
                    className="cv-tool-icon"
                    title={tool}
                    style={{ background: toolColors[tool] ?? "#555" }}
                  >
                    {tool.slice(0, 2)}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section>
        <motion.div
          className="cv-section-head"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="section-title">Education</h2>
        </motion.div>
        <motion.div
          className="cv-edu-list"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
        >
          {education.map((item) => (
            <motion.article key={item.degree} className="glass-card cv-edu-item" variants={fadeUp}>
              <h3>{item.degree}</h3>
              <p className="school">{item.school}</p>
              {item.detail && <p className="detail">{item.detail}</p>}
              <span className="period">{item.period}</span>
            </motion.article>
          ))}
        </motion.div>
      </section>
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

      <motion.a
        variants={fadeUp}
        className="cv-contact__chip"
        href={`mailto:${contact.email}`}
      >
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

  if (loading) return <div className="loading">Loading portfolio…</div>;
  if (!data) return <div className="error">{error ?? "Something went wrong"}</div>;

  return (
    <div className="page">
      <div className="page__glow" aria-hidden />
      <main className="page__inner cv-grid">
        <Header profile={data.profile} />
        <TopRow data={data} />
        <Experience data={data.experience} />
        <FeaturedWork data={data.featuredWork} />
        <SkillsEducation skills={data.skills} education={data.education} />
        <ContactBar contact={data.contact} />
        {error && (
          <p className="error" style={{ fontSize: "0.75rem", textAlign: "center", margin: 0 }}>
            Using cached content ({error})
          </p>
        )}
      </main>
    </div>
  );
}

