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
    <footer className="bg-forge-950">
      {/* Main footer grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="container grid gap-8 py-12 md:grid-cols-3"
      >
        {/* Brand column */}
        <motion.div variants={colVariants} className="space-y-4">
          <div>
            <p className="font-display text-2xl font-bold uppercase tracking-[0.05em] text-alloy-white">
              Delta Mill
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-safety-orange">
              Stores
            </p>
          </div>
          <p className="text-sm leading-relaxed text-blueprint-100/70">
            Industrial hardware and machinery suppliers serving workshops, plants, and
            procurement teams from Kanpur since 1987.
          </p>
          <div className="h-px w-12 bg-safety-orange/50" />
          <p className="font-mono text-xs tracking-[0.08em] text-steel-400">
            B2B Wholesale · Grade-Certified Stock
          </p>
        </motion.div>

        {/* Quick links */}
        <motion.div variants={colVariants} className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-alloy-white">
            Quick Links
          </h3>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex items-center gap-1.5 text-sm text-blueprint-100/60 transition-colors hover:text-blueprint-100"
                >
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Contact column */}
        <motion.div variants={colVariants} className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-alloy-white">
            Contact
          </h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-blueprint-100/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-safety-orange" />
              <span>
                78/45 Latouche Road, Anwar Ganj,<br />
                Mulganj, Kanpur, UP — 208001
              </span>
            </li>
            <li className="flex items-center gap-3 text-sm text-blueprint-100/70">
              <Phone className="h-4 w-4 shrink-0 text-safety-orange" />
              <span className="font-mono tracking-[0.03em]">512-2362054</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-blueprint-100/70">
              <Mail className="h-4 w-4 shrink-0 text-safety-orange" />
              <span>deltamillstores@example.com</span>
            </li>
            <li className="pt-1 text-sm text-blueprint-100/60">
              Contact: Ms. Shalini Awasthi
            </li>
          </ul>
        </motion.div>
      </motion.div>

      {/* Bottom bar */}
      <div className="border-t border-steel-500/15">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-steel-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Delta Mill Stores. All rights reserved.</p>
          <p className="font-mono tracking-[0.05em]">Kanpur, Uttar Pradesh, India</p>
        </div>
      </div>
    </footer>
  );
}
