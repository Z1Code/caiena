"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger index — each child increments delay by 0.08s */
  index?: number;
  /** Custom y offset. Default 32. */
  y?: number;
}

export function ScrollReveal({ children, className, index = 0, y = 32 }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            delay: index * 0.08,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a section container — staggers all direct ScrollReveal children */
export function ScrollRevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Same as ScrollReveal but uses spring physics */
export function SpringReveal({ children, className, index = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      whileInView={{
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          delay: index * 0.08,
          type: "spring",
          stiffness: 200,
          damping: 20,
        },
      }}
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}
