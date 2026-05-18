import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type GlassCardProps = HTMLMotionProps<"article"> & {
  children: ReactNode;
  featured?: boolean;
};

export function GlassCard({ children, className = "", featured, ...props }: GlassCardProps) {
  return (
    <motion.article
      className={`glass-card ${featured ? "glass-card--featured" : ""} ${className}`.trim()}
      {...props}
    >
      <span className="glass-card__rim" aria-hidden />
      <span className="glass-card__sheen" aria-hidden />
      <span className="glass-card__bloom" aria-hidden />
      <motion.div className="glass-card__content">{children}</motion.div>
    </motion.article>
  );
}
