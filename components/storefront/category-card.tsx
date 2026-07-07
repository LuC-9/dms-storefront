"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Category } from "@prisma/client";
import { EASE_OUT } from "@/lib/motion-presets";

type CategoryCardProps = {
  category: Category & { _count?: { products: number } };
  featured?: boolean;
};

export function CategoryCard({ category, featured = false }: CategoryCardProps) {
  const fallbackImage = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(category.name)}&w=800&h=600&c=7&rs=1&p=0&o=5&pid=1.7`;
  const [imageSrc, setImageSrc] = useState(category.imageUrl ?? fallbackImage);
  const categoryCode = category.slug
    .split("-")
    .map((part) => part[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();

  return (
    <Link href={`/categories/${category.slug}`} className="block h-full">
      <motion.article
        className="group industrial-surface flex h-full flex-col overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        whileHover={{ y: -4 }}
      >
        <div className={`relative overflow-hidden bg-surface-muted ${featured ? "min-h-[160px] flex-1" : "h-32"}`}>
          <motion.div className="relative h-full w-full" whileHover={{ scale: 1.05 }} transition={{ duration: 0.4 }}>
            <Image
              src={imageSrc}
              alt={category.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              onError={() => setImageSrc(fallbackImage)}
            />
          </motion.div>
        </div>
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <span className="spec-plate mb-2">DMS-{categoryCode}</span>
            <h3 className={`font-display font-bold text-iron-800 group-hover:text-safety-orange ${featured ? "text-lg md:text-xl" : "text-base"}`}>
              {category.name}
            </h3>
            <p className="font-sans text-xs text-steel-500 mt-0.5">
              {category._count?.products ?? 0} products available
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-iron-800 ring-1 ring-steel-200 transition-all group-hover:bg-safety-orange group-hover:text-white group-hover:ring-safety-orange shadow-sm">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </motion.article>
    </Link>
  );
}
