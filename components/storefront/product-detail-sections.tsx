"use client";

import { motion } from "framer-motion";
import { Price } from "@/components/storefront/price";
import { EASE_OUT, staggerContainer, fadeUp } from "@/lib/motion-presets";

type SpecRow = { label: string; value: React.ReactNode };

export function ProductSpecTable({ rows }: { rows: SpecRow[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="industrial-surface overflow-hidden"
    >
      <table className="min-w-full text-sm">
        <thead className="bg-iron-800 text-left text-white">
          <tr>
            <th className="px-5 py-3.5 font-semibold">Parameter</th>
            <th className="px-5 py-3.5 font-semibold">Value</th>
          </tr>
        </thead>
        <motion.tbody
          variants={staggerContainer(0.05, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {rows.map((row) => (
            <motion.tr
              key={row.label}
              variants={fadeUp}
              className="border-t border-steel-100 transition-colors hover:bg-surface-muted/50"
            >
              <td className="px-5 py-3.5 font-medium text-steel-600">{row.label}</td>
              <td className="px-5 py-3.5 text-iron-800">{row.value}</td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </motion.section>
  );
}

export function ProductDescriptionSection({ description }: { description: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="industrial-surface space-y-3 p-5 md:p-6"
    >
      <h2 className="font-display text-lg font-bold text-iron-800">Industrial use notes</h2>
      <p className="text-sm leading-relaxed text-steel-600">{description}</p>
    </motion.section>
  );
}

export function RelatedProductsSection({
  categoryName,
  children,
}: {
  categoryName: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 border-t border-steel-200 pt-8">
      <motion.h2
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="section-heading"
      >
        More from {categoryName}
      </motion.h2>
      {children}
    </section>
  );
}

export { Price };
