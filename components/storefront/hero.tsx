"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

const heroStats = [
  { value: "34+", label: "Products" },
  { value: "25", label: "Categories" },
  { value: "B2B", label: "Wholesale" },
  { value: "1987", label: "Established" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-forge-950">
      {/* Blueprint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(220,232,242,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220,232,242,1) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="container relative z-10 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          {/* Left: Text */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-5"
          >
            <motion.p
              variants={item}
              className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-safety-orange"
            >
              Est. 1987 · Kanpur, India
            </motion.p>

            <motion.h1
              variants={item}
              className="font-display text-5xl font-bold uppercase leading-none tracking-[0.02em] text-alloy-white md:text-7xl"
            >
              Delta<br />Mill<br />
              <span className="text-safety-orange">Stores</span>
            </motion.h1>

            <motion.div
              variants={item}
              className="h-px w-16 bg-safety-orange"
            />

            <motion.p
              variants={item}
              className="max-w-sm text-sm leading-relaxed text-blueprint-100"
            >
              Precision-grade industrial hardware and machinery for workshops,
              manufacturing plants, and procurement teams across India.
            </motion.p>

            <motion.div
              variants={item}
              className="flex flex-wrap items-center gap-3"
            >
              <Button
                asChild
                className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
              >
                <Link href="/catalogue" className="flex items-center gap-2">
                  Browse catalogue <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="rounded-none border border-steel-500/40 font-display uppercase tracking-[0.05em] text-alloy-white hover:bg-iron-800"
              >
                <Link href="/contact">Get a quote</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={item}
              className="flex items-center gap-2 font-mono text-xs tracking-[0.05em] text-steel-400"
            >
              <Phone className="h-3 w-3 text-safety-orange" />
              <span>512-2362054</span>
            </motion.div>
          </motion.div>

          {/* Right: Image with parallax */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
            className="relative h-[300px] overflow-hidden border border-steel-500/30 md:h-[460px]"
          >
            <motion.div
              className="absolute inset-0"
              style={{ y: imageY, scale: imageScale }}
            >
              <Image
                src="https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=1200&q=80"
                alt="Industrial machinery equipment at Delta Mill Stores"
                fill
                className="object-cover opacity-80"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-forge-950/70 via-transparent to-transparent" />
            {/* Blueprint corner markers */}
            <div className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-safety-orange/70" />
            <div className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-safety-orange/70" />
            <div className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-safety-orange/70" />
            <div className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-safety-orange/70" />
            {/* Spec label on image */}
            <div className="absolute bottom-4 left-4 font-mono text-[0.6rem] tracking-[0.15em] text-safety-orange/80 uppercase">
              Industrial Grade Equipment
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.75, ease: "easeOut" }}
        className="border-t border-steel-500/20 bg-iron-800/60"
      >
        <div className="container">
          <div className="grid grid-cols-2 divide-x divide-y divide-steel-500/20 md:grid-cols-4 md:divide-y-0">
            {heroStats.map((stat) => (
              <div key={stat.label} className="px-4 py-4 text-center">
                <p className="font-display text-xl font-bold text-safety-orange md:text-2xl">
                  {stat.value}
                </p>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
