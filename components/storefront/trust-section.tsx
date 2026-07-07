"use client";

import { Shield, Truck, Headphones, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, Stagger, StaggerItem } from "@/components/storefront/reveal";

const features = [
  { Icon: Shield, code: "QC", title: "Grade-certified stock", desc: "Valves, gauges, and fittings selected for industrial use." },
  { Icon: Truck, code: "DSP", title: "Fast Kanpur dispatch", desc: "Orders before noon leave the same day from our local hub." },
  { Icon: Headphones, code: "RFQ", title: "Procurement support", desc: "Direct team access for custom quotes and bulk schedules." },
  { Icon: Award, code: "1987", title: "Trusted since 1987", desc: "Three decades serving manufacturing across Uttar Pradesh." },
];

export function TrustSection() {
  return (
    <section className="relative py-12 md:py-16">
      <div className="container relative space-y-8">
        <Reveal direction="blur" className="mx-auto max-w-2xl text-center">
          <p className="industrial-eyebrow">Procurement standards</p>
          <h2 className="section-heading mt-2">Built for industry, designed for trust</h2>
        </Reveal>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ Icon, code, title, desc }) => (
            <StaggerItem key={title}>
              <motion.div whileHover={{ y: -3 }} className="industrial-surface h-full space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-safety-orange/20 bg-safety-orange/5">
                    <Icon className="h-5 w-5 text-safety-orange" strokeWidth={1.5} />
                  </div>
                  <span className="spec-plate">{code}</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-base font-bold text-iron-800">{title}</h3>
                  <p className="text-sm leading-relaxed text-steel-500">{desc}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
