"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { EASE_OUT, fadeScale, staggerContainer } from "@/lib/motion-presets";

export type BentoSpan = "1x1" | "2x1" | "1x2" | "2x2" | "3x1" | "4x1";

const spanClasses: Record<BentoSpan, string> = {
  "1x1": "",
  "2x1": "sm:col-span-2",
  "1x2": "sm:row-span-2",
  "2x2": "sm:col-span-2 sm:row-span-2",
  "3x1": "sm:col-span-2 lg:col-span-3",
  "4x1": "col-span-full",
};

type BentoCellProps = {
  children: React.ReactNode;
  span?: BentoSpan;
  variant?: "light" | "dark" | "accent" | "ghost";
  className?: string;
  animate?: boolean;
};

const variantClasses = {
  light: "bg-alloy-white",
  dark: "bg-iron-800 text-white",
  accent: "bg-safety-orange text-white",
  ghost: "bg-surface-muted",
};

export function BentoGrid({
  children,
  className,
  stagger = true,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const gridClass = cn(
    "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:auto-rows-[minmax(120px,auto)] lg:grid-cols-4 lg:auto-rows-[minmax(130px,auto)]",
    className,
  );

  if (!stagger) return <div className={gridClass}>{children}</div>;

  return (
    <motion.div
      className={gridClass}
      variants={staggerContainer(0.07, 0.08)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

export function BentoCell({
  children,
  span = "1x1",
  variant = "light",
  className,
  animate = true,
}: BentoCellProps) {
  const inner = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className={cn(
        "group relative h-full overflow-hidden rounded-3xl shadow-card ring-1 ring-steel-200/50 transition-shadow hover:shadow-card-hover hover:ring-steel-300/60",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </motion.div>
  );

  const wrapperClass = cn("h-full", spanClasses[span]);
  if (!animate) return <div className={wrapperClass}>{inner}</div>;

  return (
    <motion.div className={wrapperClass} variants={fadeScale}>
      {inner}
    </motion.div>
  );
}
