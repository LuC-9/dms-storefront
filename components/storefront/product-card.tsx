import Image from "next/image";
import Link from "next/link";
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
    <article className="group flex h-full flex-col overflow-hidden border border-steel-500/25 bg-alloy-white transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:scale-[1.02] motion-safe:hover:border-steel-500/40 motion-safe:hover:shadow-xl">
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={600}
        height={400}
        className="h-40 w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="font-mono text-2xs uppercase tracking-[0.05em] text-steel-500">
          {product.category?.name ?? "Industrial components"}
        </p>
        <h3 className="font-display text-xl font-semibold leading-tight tracking-[0.02em]">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-steel-500">{product.description}</p>
        <SpecPlate lines={[`${sku}   ${spec}`]} className="shadow-none" />
        <div className="flex items-center justify-between">
          <p className="text-base">
            <Price valueInPaise={product.priceInPaise} className="text-base" />
          </p>
          <span className="text-xs text-steel-500">
            {product.inStock ? "● Available for dispatch" : "○ Out of stock - call to enquire"}
          </span>
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
          className="text-sm font-medium text-iron-800 underline-offset-4 hover:underline"
        >
          View details →
        </Link>
      </div>
    </article>
  );
}
