"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-safety-orange">
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="container relative z-10 py-14 md:py-18">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-orange-200">
            Ready to order?
          </p>
          <h2 className="font-display text-3xl font-bold uppercase tracking-[0.03em] text-white md:text-4xl">
            Industrial hardware,<br className="hidden sm:block" /> shipped from Kanpur
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-orange-100">
            Browse our catalogue or contact our procurement team for bulk pricing,
            custom orders, and stock availability.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="rounded-none border border-white bg-white font-display uppercase tracking-[0.05em] text-safety-orange hover:bg-orange-50"
            >
              <Link href="/catalogue" className="flex items-center gap-2">
                Browse catalogue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-none border border-white/40 font-display uppercase tracking-[0.05em] text-white hover:bg-white/10"
            >
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
