"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Product, Category } from "@prisma/client";
import { Price } from "@/components/storefront/price";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { WishlistToggle } from "@/components/storefront/wishlist-toggle";
import { getSkuLabel } from "@/components/storefront/product-spec";
import { EASE_OUT } from "@/lib/motion-presets";

type ProductCardProps = {
  product: Product & { category?: Category };
  featured?: boolean;
};

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const fallback = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(product.name)}&w=600&h=400&c=7&rs=1&p=0&o=5&pid=1.7`;
  const [imageSrc, setImageSrc] = useState(product.imageUrl);
  const sku = getSkuLabel({ sku: product.sku, name: product.name, category: product.category?.name });
  const isValve = product.category?.name.toLowerCase().includes("valve") || product.name.toLowerCase().includes("valve");

  return (
    <motion.article
      className="group industrial-surface flex h-full flex-col overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      whileHover={{ y: -4, transition: { duration: 0.22, ease: EASE_OUT } }}
    >
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden">
        <motion.div
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className={`relative bg-surface-muted ${featured ? "aspect-[4/3]" : "aspect-square"}`}
        >
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImageSrc(fallback)}
          />
        </motion.div>
        {product.inStock ? (
          <span className="stock-badge absolute right-3 top-3 bg-safety-orange text-white shadow-sm">
            In stock
          </span>
        ) : (
          <span className="stock-badge absolute right-3 top-3 bg-iron-800 text-steel-100 shadow-sm">
            Enquire
          </span>
        )}
        <div className="absolute left-3 top-3 z-10">
          <WishlistToggle productId={product.id} />
        </div>
      </Link>

      <div className={`flex flex-1 flex-col gap-2 p-5 ${featured ? "p-6" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-sans text-xs font-semibold text-safety-orange">
            {product.category?.name ?? "Industrial"}
          </p>
          {isValve && <span className="spec-plate">Valve line</span>}
        </div>
        <Link href={`/products/${product.slug}`}>
          <h3 className={`font-display font-bold leading-tight text-iron-800 transition-colors group-hover:text-safety-orange ${featured ? "text-lg md:text-xl" : "text-base"}`}>
            {product.name}
          </h3>
        </Link>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-steel-400">{sku}</p>
        <div className="mt-auto space-y-3 border-t border-steel-100 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-xs text-steel-500">B2B supply price</span>
            <Price valueInPaise={product.priceInPaise} className="text-lg font-bold text-iron-800" />
          </div>
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              imageUrl: product.imageUrl,
              priceInPaise: product.priceInPaise,
              inStock: product.inStock,
            }}
          />
        </div>
      </div>
    </motion.article>
  );
}
