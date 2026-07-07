"use client";

import Link from "next/link";
import { ArrowRight, Truck, Clock } from "lucide-react";
import { BentoCell, BentoGrid } from "@/components/storefront/bento-cell";

export function CtaBanner() {
  return (
    <section className="py-10 md:py-14">
      <div className="container">
        <BentoGrid>
          <BentoCell span="2x2" variant="dark" className="!rounded-3xl ring-1 ring-steel-500/30">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-safety-orange/70 to-transparent" />
            <div className="relative flex h-full flex-col justify-center gap-5 p-6 md:p-10">
              <p className="industrial-eyebrow !text-safety-orange">Dispatch · Kanpur valve supply</p>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
                Valves, fittings &amp; hardware, shipped same day
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-steel-300">
                Browse pressure-rated stock or contact procurement for bulk B2B pricing and delivery schedules.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Ball valves", "Globe valves", "Flanges", "Gauges"].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-steel-200">
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/catalogue" className="btn-primary gap-2">
                  Browse catalogue <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
                  Contact procurement
                </Link>
              </div>
            </div>
          </BentoCell>

          <BentoCell span="1x1" variant="accent" className="!rounded-3xl">
            <div className="flex h-full flex-col items-center justify-center gap-2 p-5 text-center">
              <Truck className="h-6 w-6 text-white/90" />
              <p className="font-display text-xl font-bold text-white">Same-day</p>
              <p className="font-sans text-xs text-orange-100">Kanpur dispatch</p>
            </div>
          </BentoCell>

          <BentoCell span="1x1" variant="accent" className="!bg-accent-600 !rounded-3xl">
            <div className="flex h-full flex-col items-center justify-center gap-2 p-5 text-center">
              <Clock className="h-6 w-6 text-white/90" />
              <p className="font-display text-xl font-bold text-white">Before noon</p>
              <p className="font-sans text-xs text-orange-100">Order cutoff</p>
            </div>
          </BentoCell>

          <BentoCell span="2x1" variant="ghost" className="!rounded-3xl">
            <div className="flex h-full flex-col justify-center gap-3 p-5 md:p-6">
              <p className="industrial-eyebrow">About Delta Mills Store</p>
              <h3 className="font-display text-xl font-bold leading-tight text-iron-800 md:text-2xl">
                Kanpur&apos;s trusted industrial supplier
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-steel-600">
                Supplying valves, fittings, gauges, bearings, and machinery components to workshops,
                OEM teams, and manufacturing plants across Uttar Pradesh since 1987.
              </p>
              <Link href="/about" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-safety-orange hover:underline">
                Read more about us <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </BentoCell>
        </BentoGrid>
      </div>
    </section>
  );
}
