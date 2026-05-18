import { motion } from "framer-motion";
import type { Portfolio } from "../types/portfolio";
import { fadeUp, stagger } from "./motion";

type SiteHeroProps = {
  profile: Portfolio["profile"];
  objective: Portfolio["objective"];
};

export function SiteHero({ profile, objective }: SiteHeroProps) {
  return (
    <section id="top" className="site-hero">
      <motion.div
        className="site-hero__content"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.p className="site-hero__eyebrow" variants={fadeUp}>
          {profile.tagline}
        </motion.p>
        <motion.h1 className="site-hero__title" variants={fadeUp}>
          {profile.name}
        </motion.h1>
        <motion.p className="site-hero__role" variants={fadeUp}>
          {profile.role}
        </motion.p>
        <motion.p className="site-hero__lead" variants={fadeUp}>
          {objective.body}
        </motion.p>
        <motion.div className="site-hero__actions" variants={fadeUp}>
          <a href="#work" className="btn-cta btn-cta--pink btn-cta--lg">
            View featured work
          </a>
          <a href="#contact" className="btn-cta btn-cta--white btn-cta--lg">
            Get in touch
          </a>
          <a
            href={profile.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta btn-cta--ghost btn-cta--lg"
          >
            chaosstudio.mv →
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
