"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Stagger, StaggerItem } from "@/components/storefront/reveal";
import { ProductCard } from "@/components/storefront/product-card";
import { EASE_OUT } from "@/lib/motion-presets";
import type { Category, Product } from "@prisma/client";

type ProductWithCategory = Product & { category?: Category };

export function CatalogueProductGrid({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="border border-steel-500/20 bg-alloy-white px-8 py-16 text-center"
      >
        <p className="font-display text-xl font-semibold uppercase tracking-[0.05em] text-iron-800">
          No products found
        </p>
        <p className="mt-2 text-sm text-steel-500">Try adjusting your filters.</p>
        <Link
          href="/catalogue"
          className="mt-4 inline-block font-mono text-sm uppercase tracking-[0.05em] text-safety-orange hover:underline"
        >
          Clear all filters
        </Link>
      </motion.div>
    );
  }

  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" stagger={0.05}>
      {products.map((product, index) => (
        <StaggerItem key={product.id} direction="scale">
          <ProductCard product={product} featured={index === 0} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
