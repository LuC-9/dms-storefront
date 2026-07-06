"use client";

import { motion } from "framer-motion";
import { Shield, Truck, Headphones, Award } from "lucide-react";

const features = [
  {
    Icon: Shield,
    title: "Grade-Certified Stock",
    desc: "Every product is grade-certified for industrial use. No substitutes, no compromises on specification.",
  },
  {
    Icon: Truck,
    title: "Fast Dispatch",
    desc: "Orders confirmed before noon leave the same day from our Kanpur warehouse.",
  },
  {
    Icon: Headphones,
    title: "Direct Procurement Support",
    desc: "Talk to our team directly for quotations, stock checks, and bulk supply schedules.",
  },
  {
    Icon: Award,
    title: "Trusted Since 1987",
    desc: "Over three decades supplying Kanpur's manufacturing and engineering sector.",
  },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

export function TrustSection() {
  return (
    <section className="py-14 md:py-20">
      <div className="container space-y-10">
        <div className="space-y-2 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-safety-orange">
            Why procurement teams choose us
          </p>
          <h2 className="font-display text-3xl font-bold uppercase tracking-[0.03em] text-iron-800 md:text-4xl">
            Built for industry, not retail
          </h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map(({ Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={itemVariants}
              className="group space-y-4 border border-steel-500/25 bg-alloy-white p-6 transition-[border-color] duration-300 hover:border-safety-orange/40"
            >
              <div className="flex h-10 w-10 items-center justify-center border border-safety-orange/25 bg-safety-orange/8 transition-colors duration-300 group-hover:border-safety-orange/50 group-hover:bg-safety-orange/15">
                <Icon className="h-5 w-5 text-safety-orange" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-semibold uppercase tracking-[0.03em] text-iron-800">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-steel-500">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
