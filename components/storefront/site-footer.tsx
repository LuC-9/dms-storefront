"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";

const quickLinks = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/categories/valves", label: "Valves" },
  { href: "/categories/bearings", label: "Bearings" },
  { href: "/categories/pumps", label: "Pumps" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const colVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function SiteFooter() {
  return (
    <footer className="relative bg-forge-950 border-t border-steel-500/15 overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 bg-blueprint-grid opacity-5 pointer-events-none" />

      {/* Main footer grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="container relative z-10 grid gap-10 py-16 md:grid-cols-3"
      >
        {/* Brand column */}
        <motion.div variants={colVariants} className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="bg-safety-orange px-1.5 py-0.5 font-mono text-xs font-black tracking-tighter text-forge-950">DMS</span>
            <div>
              <p className="font-display text-xl font-extrabold uppercase tracking-[0.08em] text-alloy-white leading-none">
                Delta Mills
              </p>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-safety-orange leading-none mt-1">
                Store
              </p>
            </div>
          </div>
          <p className="text-xs md:text-sm leading-relaxed text-blueprint-100/70 font-sans">
            Precision-grade industrial hardware, machinery components, and trusted wholesale supply serving workshops, OEM plants, and procurement teams from Kanpur since 1987.
          </p>
          <div className="h-[2px] w-16 bg-safety-orange/40" />
          <div className="space-y-1">
            <p className="font-mono text-[0.65rem] tracking-[0.1em] text-steel-400 uppercase">
              B2B WHOLESALE // GRADE-CERTIFIED STOCK
            </p>
            <p className="font-mono text-[0.6rem] tracking-[0.05em] text-steel-500 uppercase">
              REGISTRATION NO: DMS-UP-1987-042
            </p>
          </div>
        </motion.div>

        {/* Quick links */}
        <motion.div variants={colVariants} className="space-y-5">
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-alloy-white border-b border-steel-500/10 pb-2">
            SYSTEM INDEX // LINKS
          </h3>
          <ul className="space-y-2.5">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-blueprint-100/60 transition-colors hover:text-safety-orange"
                >
                  <span className="text-safety-orange opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                    //
                  </span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Contact column */}
        <motion.div variants={colVariants} className="space-y-5">
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-alloy-white border-b border-steel-500/10 pb-2">
            KANPUR DEPOT // CONTACT
          </h3>
          <div className="border border-steel-500/15 bg-iron-800/20 p-4 space-y-4 relative">
            {/* Corner bracket details */}
            <div className="absolute left-2 top-2 h-2 w-2 border-l border-t border-steel-500/30" />
            <div className="absolute right-2 top-2 h-2 w-2 border-r border-t border-steel-500/30" />
            <div className="absolute bottom-2 left-2 h-2 w-2 border-b border-l border-steel-500/30" />
            <div className="absolute bottom-2 right-2 h-2 w-2 border-b border-r border-steel-500/30" />

            <ul className="space-y-3">
              <li className="flex gap-3 text-xs md:text-sm text-blueprint-100/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-safety-orange" />
                <span className="font-sans leading-relaxed">
                  78/45 Latouche Road, Anwar Ganj,<br />
                  Mulganj, Kanpur, UP — 208001
                </span>
              </li>
              <li className="flex items-center gap-3 text-xs md:text-sm text-blueprint-100/70">
                <Phone className="h-4 w-4 shrink-0 text-safety-orange" />
                <span className="font-mono tracking-[0.05em]">+91 512-2362054</span>
              </li>
              <li className="flex items-center gap-3 text-xs md:text-sm text-blueprint-100/70">
                <Mail className="h-4 w-4 shrink-0 text-safety-orange" />
                <span className="font-mono text-xs">deltamillstores@example.com</span>
              </li>
              <li className="pt-2 border-t border-steel-500/10 text-[0.65rem] font-mono text-steel-400 uppercase tracking-wider">
                CHIEF PROCUREMENT: Mr. Vineet Awasthi
              </li>
            </ul>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom bar */}
      <div className="border-t border-steel-500/10 bg-forge-950 py-6 relative z-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-xs text-steel-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Delta Mills Store. All rights reserved.</p>
          <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.1em] text-steel-500 uppercase">
            <span>SYS-VER: DMS-14.2.0</span>
            <span className="hidden sm:inline">//</span>
            <span>KANPUR, UTTAR PRADESH, INDIA</span>
            <span className="hidden sm:inline">//</span>
            <span>DEV: LuC</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
