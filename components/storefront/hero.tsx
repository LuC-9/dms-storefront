"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Gauge, Phone, Wrench } from "lucide-react";
import { EASE_OUT, fadeUp, staggerContainer } from "@/lib/motion-presets";

const stats = [
  { value: "34+", label: "Valve & hardware SKUs" },
  { value: "25", label: "Industrial categories" },
  { value: "B2B", label: "Procurement pricing" },
  { value: "1987", label: "Supplying Kanpur" },
];

export function Hero() {
  return (
    <section className="relative pb-8 md:pb-12">
      <div className="container pt-4 md:pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_80%_0%,rgba(204,85,0,0.22),transparent_32%),linear-gradient(135deg,#0D1B2A,#1A3148_52%,#0D1B2A)] px-6 py-10 shadow-xl ring-1 ring-steel-500/20 md:px-12 md:py-14 lg:py-16"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-safety-orange/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-safety-orange/70 to-transparent" />

          <div className="relative z-10 grid items-center gap-8 md:grid-cols-2 md:gap-10">
            <motion.div
              variants={staggerContainer(0.1, 0.15)}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              <motion.p variants={fadeUp} className="industrial-eyebrow flex items-center gap-2">
                <Wrench className="h-3 w-3" />
                Valves · Fittings · Industrial Hardware · Kanpur
              </motion.p>
              <motion.h1
                variants={fadeUp}
                className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl"
              >
                Valve-ready supply for workshops &amp; plants
              </motion.h1>
              <motion.p variants={fadeUp} className="max-w-md text-sm leading-relaxed text-blueprint-100/80 md:text-base">
                Grade-certified valves, bearings, pumps, flanges, and industrial components —
                wholesale dispatch from Kanpur since 1987.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-1">
                <Link href="/catalogue" className="btn-primary gap-2">
                  Browse catalogue <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="btn-secondary border-steel-500/40 bg-white/5 text-white hover:bg-white/10">
                  Request quote
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="flex items-center gap-2 font-sans text-xs tracking-wide text-steel-300">
                <Phone className="h-3.5 w-3.5 text-safety-orange" />
                <span>512-2362054 · Same-day dispatch before noon</span>
              </motion.div>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-1">
                {["Ball valves", "Pressure gauges", "Flanges", "Pump spares"].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-steel-200">
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.2 }}
              className="relative mx-auto w-full max-w-md md:max-w-none"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-iron-800 ring-1 ring-white/10 shadow-lg">
                <motion.div
                  className="absolute inset-0"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&h=800&fit=crop"
                    alt="Industrial valves and hardware at Delta Mill Stores"
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-forge-950/80 via-forge-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-sans text-[0.65rem] font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                  <Gauge className="h-3.5 w-3.5 text-safety-orange" />
                  Pressure-rated industrial stock
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-center backdrop-blur-sm"
              >
                <p className="font-display text-xl font-bold text-safety-orange md:text-2xl">{value}</p>
                <p className="font-sans text-[0.7rem] text-steel-300 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
