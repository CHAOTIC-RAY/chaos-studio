import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "./motion";

type SiteSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function SiteSection({ id, title, subtitle, children, className = "" }: SiteSectionProps) {
  return (
    <section id={id} className={`site-section ${className}`.trim()}>
      <motion.header
        className="site-section__head"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
        <h2 className="site-section__title">{title}</h2>
        {subtitle && <p className="site-section__subtitle">{subtitle}</p>}
      </motion.header>
      {children}
    </section>
  );
}
