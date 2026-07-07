"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion-presets";
import { Price } from "@/components/storefront/price";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";

type ProductDetailInfoProps = {
  categoryName: string;
  productName: string;
  sku: string;
  spec: string;
  priceInPaise: number;
  inStock: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    priceInPaise: number;
    inStock: boolean;
    stockCount: number | null;
    lowStockAlert: number;
  };
  variants: {
    id: string;
    name: string;
    sku: string | null;
    priceInPaise: number | null;
    stockCount: number | null;
    inStock: boolean;
    sortOrder: number;
  }[];
  initialEmail?: string | null;
};

export function ProductDetailInfo(props: ProductDetailInfoProps) {
  const { categoryName, productName, priceInPaise, inStock, product, variants, initialEmail } = props;

  return (
    <motion.div
      variants={staggerContainer(0.08, 0.1)}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.span
        variants={fadeUp}
        className="spec-plate"
      >
        {categoryName}
      </motion.span>

      <motion.h1 variants={fadeUp} className="font-display text-3xl font-bold text-iron-800 md:text-4xl">
        {productName}
      </motion.h1>

      <motion.div variants={fadeUp}>
        <Price valueInPaise={priceInPaise} className="text-3xl font-bold text-iron-800" />
      </motion.div>

      <motion.p
        variants={fadeUp}
        className={`text-sm font-medium ${inStock ? "text-safety-orange" : "text-steel-500"}`}
      >
        {inStock ? "Available for dispatch · suitable for B2B procurement" : "Out of stock — call to enquire"}
      </motion.p>

      <motion.div variants={fadeUp} className="industrial-surface p-4 md:p-5">
        <ProductPurchasePanel product={product} variants={variants} initialEmail={initialEmail} />
      </motion.div>

      <motion.p variants={fadeUp} className="text-sm text-steel-500">
        Bulk enquiries: 512-2362054
      </motion.p>
    </motion.div>
  );
}
