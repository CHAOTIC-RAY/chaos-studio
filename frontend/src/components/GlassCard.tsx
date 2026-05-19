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
      <motion.div className="glass-card__content">{children}</motion.div>
    </motion.article>
  );
}
