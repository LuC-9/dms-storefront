"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Category } from "@prisma/client";

type CategoryCardProps = {
  category: Category & { _count?: { products: number } };
};

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <motion.article
        className="group h-full overflow-hidden border border-steel-500/25 bg-alloy-white"
        whileHover={{ y: -4, boxShadow: "0 14px 32px -6px rgba(13,27,42,0.22)", borderColor: "rgba(69,99,122,0.5)" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <div className="relative overflow-hidden">
          <Image
            src={category.imageUrl ?? "https://placehold.co/600x400/1e3a8a/ffffff?text=Category"}
            alt={category.name}
            width={600}
            height={400}
            className="h-36 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forge-950/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="space-y-1 p-4">
          <h3 className="font-display text-xl font-semibold uppercase tracking-[0.05em] text-iron-800">
            {category.name}
          </h3>
          <p className="font-mono text-xs tracking-[0.03em] text-steel-500">
            {category._count?.products ?? 0} products
          </p>
        </div>
      </motion.article>
    </Link>
  );
}
