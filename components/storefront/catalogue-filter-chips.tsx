"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SNAP } from "@/lib/motion-presets";

type CategoryChip = {
  id: string;
  name: string;
  href: string;
  active: boolean;
};

type CatalogueFilterChipsProps = {
  inStockHref: string;
  inStockOnly: boolean;
  allCategoriesHref: string;
  categorySlug: string | null;
  categoryChips: CategoryChip[];
};

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative">
      {active && (
        <motion.span
          layoutId="catalogue-filter-pill"
          className="absolute inset-0 rounded-full bg-iron-800"
          transition={SPRING_SNAP}
        />
      )}
      <span
        className={`pill-chip relative z-10 ${active ? "pill-chip-active !bg-transparent !text-white !shadow-none" : "pill-chip-inactive"}`}
      >
        {children}
      </span>
    </Link>
  );
}

export function CatalogueFilterChips({
  inStockHref,
  inStockOnly,
  allCategoriesHref,
  categorySlug,
  categoryChips,
}: CatalogueFilterChipsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={inStockHref}>
          <span className={`pill-chip ${inStockOnly ? "pill-chip-active bg-safety-orange !text-white" : "pill-chip-inactive"}`}>
            In stock only
          </span>
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-steel-500">Category</span>
        <FilterPill href={allCategoriesHref} active={!categorySlug}>
          All
        </FilterPill>
        {categoryChips.map((cat) => (
          <FilterPill key={cat.id} href={cat.href} active={cat.active}>
            {cat.name}
          </FilterPill>
        ))}
      </div>
    </div>
  );
}

export function ActiveFilterPills({ pills }: { pills: { label: string; href: string }[] }) {
  return (
    <motion.div layout className="flex flex-wrap gap-2">
      <AnimatePresence mode="popLayout">
        {pills.map((pill) => (
          <motion.div
            key={pill.label}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={SPRING_SNAP}
          >
            <Link
              href={pill.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-blueprint-100 px-3 py-1.5 text-xs font-medium text-iron-800 hover:bg-steel-200"
            >
              {pill.label}
              <span className="text-steel-400">×</span>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
