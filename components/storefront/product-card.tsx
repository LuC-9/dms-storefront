"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Product, Category } from "@prisma/client";
import { Price } from "@/components/storefront/price";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { SpecPlate } from "@/components/storefront/spec-plate";
import { getSkuLabel, getSpecLabel } from "@/components/storefront/product-spec";

type ProductCardProps = {
  product: Product & { category?: Category };
};

export function ProductCard({ product }: ProductCardProps) {
  const sku = getSkuLabel({ sku: product.sku, name: product.name, category: product.category?.name });
  const spec = getSpecLabel({ sku: product.sku, name: product.name, category: product.category?.name });

  return (
    <motion.article
      className="group flex h-full flex-col overflow-hidden border border-steel-500/25 bg-alloy-white"
      whileHover={{ y: -4, boxShadow: "0 16px 40px -8px rgba(13,27,42,0.25)", borderColor: "rgba(69,99,122,0.5)" }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      <div className="relative overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={600}
          height={400}
          className="h-40 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {product.inStock ? (
          <span className="absolute right-2 top-2 bg-forge-950/80 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-safety-orange">
            In stock
          </span>
        ) : (
          <span className="absolute right-2 top-2 bg-forge-950/80 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-steel-400">
            Enquire
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-steel-500">
          {product.category?.name ?? "Industrial components"}
        </p>
        <h3 className="font-display text-xl font-semibold leading-tight tracking-[0.02em]">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-sm text-steel-500">{product.description}</p>
        <SpecPlate lines={[`${sku}   ${spec}`]} className="shadow-none" />
        <div className="mt-auto space-y-3">
          <div className="flex items-baseline justify-between">
            <Price valueInPaise={product.priceInPaise} className="text-base font-medium" />
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
          <Link
            href={`/products/${product.slug}`}
            className="flex items-center gap-1 text-sm font-medium text-iron-800 underline-offset-4 hover:underline"
          >
            View details
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              className="inline-block"
            >
              →
            </motion.span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
