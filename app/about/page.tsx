"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Package, ShieldCheck, Truck, Users, Wrench } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/storefront/reveal";

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

export default function AboutPage() {
  return (
    <div className="space-y-0">
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2rem] bg-iron-800 px-6 py-12 shadow-card-hover md:px-10 md:py-16">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-safety-orange/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl space-y-5"
              >
                <p className="industrial-eyebrow">Est. 1987 · Kanpur, India</p>
                <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
                  Built around dependable industrial supply.
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-steel-200">
                  Delta Mill Stores helps workshops, maintenance teams, and manufacturers source valves,
                  fittings, bearings, pumps, and hardware with practical guidance and fast availability.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/catalogue" className="btn-primary gap-2">
                    Browse catalogue <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/contact" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
                    Ask for a quote
                  </Link>
                </div>
              </motion.div>

              <Reveal direction="scale" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { Icon: ShieldCheck, label: "Trusted supplier", value: "Since 1987" },
                  { Icon: Truck, label: "Dispatch hub", value: "Kanpur" },
                  { Icon: Package, label: "Catalogue focus", value: "Valves + hardware" },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                    <Icon className="h-5 w-5 text-safety-orange" strokeWidth={1.7} />
                    <p className="mt-3 text-sm font-semibold text-white">{value}</p>
                    <p className="text-xs text-steel-300">{label}</p>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <Reveal direction="left" className="card-surface p-6 md:p-8">
              <p className="industrial-eyebrow">Our story</p>
              <h2 className="section-heading mt-2">A practical partner for procurement teams</h2>
              <div className="space-y-4 text-sm leading-relaxed text-steel-500">
                <p>
                  Delta Mill Stores, also known as Delta Machinery Store, is a trusted supplier
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
                  Led by Mr. Vineet Awasthi, our team brings decades of hands-on experience in
                  industrial procurement, helping clients source the right component the first time —
                  at competitive wholesale prices.
                </p>
              </div>
            </Reveal>

            <Reveal direction="right" className="card-surface p-6 md:p-8">
              <p className="industrial-eyebrow">Milestones</p>
              <h2 className="section-heading mt-2">Growing with Kanpur industry</h2>
              <ol className="mt-6 space-y-4">
                {milestones.map((m, i) => (
                  <motion.li
                    key={m.year}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="flex gap-4 rounded-2xl bg-surface-muted p-4"
                  >
                    <p className="shrink-0 font-display text-xl font-bold text-safety-orange">{m.year}</p>
                    <p className="text-sm leading-relaxed text-steel-600">{m.event}</p>
                  </motion.li>
                ))}
              </ol>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-surface-muted/50 py-14 md:py-20">
        <div className="container space-y-10">
          <Reveal>
            <div className="max-w-2xl">
              <p className="industrial-eyebrow">What we supply</p>
              <h2 className="section-heading mt-2">Core catalogue areas</h2>
              <p className="mt-3 text-sm leading-relaxed text-steel-500">
                The range is broad, but the aim stays simple: dependable components, clear availability,
                and quick support for repeat industrial buying.
              </p>
            </div>
          </Reveal>
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ Icon, name, desc }) => (
              <StaggerItem key={name} direction="scale">
                <div className="card-surface h-full p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-safety-orange/10">
                    <Icon className="h-5 w-5 text-safety-orange" strokeWidth={1.7} />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-iron-800">{name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel-500">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </div>
  );
}
