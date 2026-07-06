"use client";

import { motion } from "framer-motion";
import { Wrench, Package, Users, MapPin } from "lucide-react";

const milestones = [
  { year: "1987", event: "Delta Mill Stores founded on Latouche Road, Kanpur." },
  { year: "1995", event: "Expanded catalogue to include precision instruments and gauges." },
  { year: "2005", event: "Introduced B2B wholesale channel for OEM maintenance teams." },
  { year: "2018", event: "Launched same-day dispatch from our Anwar Ganj warehouse." },
  { year: "2024", event: "Online catalogue launched for nationwide procurement support." },
];

const categories = [
  { Icon: Wrench, name: "Valves & Fittings", desc: "Ball valves, gate valves, pipe fittings — all pressure-rated." },
  { Icon: Package, name: "Bearings & Drives", desc: "Angular contact, deep groove, cylindrical roller bearings." },
  { Icon: Users, name: "Pumps & Motors", desc: "Centrifugal, submersible, and positive displacement pumps." },
  { Icon: MapPin, name: "Steel & Flanges", desc: "ERW pipes, SS flanges, structural steel in standard sizes." },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero banner */}
      <section className="bg-forge-950 py-14 md:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE }}
            className="max-w-2xl space-y-5"
          >
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-safety-orange">
              Est. 1987 · Kanpur, India
            </p>
            <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] text-alloy-white md:text-6xl">
              About Delta<br />Mill Stores
            </h1>
            <div className="h-px w-16 bg-safety-orange" />
            <p className="text-sm leading-relaxed text-blueprint-100/80">
              Three decades of supplying Kanpur's manufacturing and engineering sector
              with precision-grade industrial hardware, machinery components, and specialist
              instruments.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story section */}
      <section className="py-14 md:py-20">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <h2 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
                Our story
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-steel-500">
                <p>
                  Delta Mill Stores — also known as Delta Machinery Store — is a trusted supplier
                  and retailer of industrial hardware, machinery components, and precision
                  instruments. Located on Latouche Road in Anwar Ganj, Kanpur, we have been
                  serving industrial buyers, engineers, and workshops across Uttar Pradesh and
                  beyond.
                </p>
                <p>
                  Our catalogue spans valves, gauges, bearings, drill bits, steel pipes, flanges,
                  pumps, and much more. We specialize in catalogue-driven procurement support for
                  workshops, OEM maintenance teams, and industrial plants requiring dependable
                  quality and fast availability.
                </p>
                <p>
                  Led by Ms. Shalini Awasthi, our team brings decades of hands-on experience in
                  industrial procurement, helping clients source the right component the first time —
                  at competitive wholesale prices.
                </p>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <h2 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
                Timeline
              </h2>
              <ol className="relative space-y-0 border-l border-steel-500/30 pl-6">
                {milestones.map((m, i) => (
                  <motion.li
                    key={m.year}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="relative pb-6 last:pb-0"
                  >
                    <span className="absolute -left-[1.625rem] top-0 flex h-4 w-4 items-center justify-center border border-safety-orange/40 bg-blueprint-100">
                      <span className="h-1.5 w-1.5 bg-safety-orange" />
                    </span>
                    <p className="font-mono text-xs uppercase tracking-[0.1em] text-safety-orange">
                      {m.year}
                    </p>
                    <p className="mt-0.5 text-sm text-steel-500">{m.event}</p>
                  </motion.li>
                ))}
              </ol>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories we cover */}
      <section className="bg-alloy-white py-14 md:py-20">
        <div className="container space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            viewport={{ once: true }}
            className="space-y-1"
          >
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-safety-orange">
              What we supply
            </p>
            <h2 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
              Our core catalogue areas
            </h2>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {categories.map(({ Icon, name, desc }) => (
              <motion.div
                key={name}
                variants={itemVariants}
                className="space-y-3 border border-steel-500/25 bg-white p-6"
              >
                <div className="flex h-9 w-9 items-center justify-center border border-safety-orange/25 bg-safety-orange/8">
                  <Icon className="h-4 w-4 text-safety-orange" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-base font-semibold uppercase tracking-[0.04em]">
                  {name}
                </h3>
                <p className="text-sm leading-relaxed text-steel-500">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
