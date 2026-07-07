"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_OUT, staggerContainer } from "@/lib/motion-presets";

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "blur";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: RevealDirection;
  once?: boolean;
};

const directionVariants: Record<RevealDirection, Variants> = {
  up: {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -28 },
    show: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -28 },
    show: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 28 },
    show: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92, y: 12 },
    show: { opacity: 1, scale: 1, y: 0 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(8px)", y: 16 },
    show: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
};

export function Reveal({
  children,
  className,
  delayMs = 0,
  direction = "up",
  once = true,
}: RevealProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={directionVariants[direction]}
      initial="hidden"
      whileInView="show"
      transition={{
        duration: 0.55,
        ease: EASE_OUT,
        delay: delayMs / 1000,
      }}
      viewport={{ once, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
};

export function Stagger({
  children,
  className,
  stagger = 0.07,
  delay = 0.06,
}: StaggerProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  direction = "up" as RevealDirection,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: RevealDirection;
}) {
  return (
    <motion.div
      className={cn(className)}
      variants={directionVariants[direction]}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
