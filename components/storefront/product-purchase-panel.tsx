"use client";

import { useRef, useState } from "react";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { StockNotifyForm } from "@/components/storefront/stock-notify-form";
import { QuoteRequestForm } from "@/components/storefront/quote-request-form";
import { StickyAddToCart } from "@/components/storefront/sticky-add-to-cart";
import { Price } from "@/components/storefront/price";

type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  priceInPaise: number | null;
  stockCount: number | null;
  inStock: boolean;
  sortOrder: number;
};

type ProductPurchasePanelProps = {
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
  variants?: ProductVariant[];
  initialEmail?: string | null;
};

export function ProductPurchasePanel({ product, variants = [], initialEmail }: ProductPurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null,
  );

  const mainButtonRef = useRef<HTMLDivElement>(null);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const effectivePrice = selectedVariant?.priceInPaise ?? product.priceInPaise;
  const effectiveInStock = selectedVariant ? selectedVariant.inStock : product.inStock;
  const effectiveStockCount = selectedVariant ? selectedVariant.stockCount : product.stockCount;

  const cartProduct = {
    id: product.id,
    name: selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name,
    slug: product.slug,
    imageUrl: product.imageUrl,
    priceInPaise: effectivePrice,
    inStock: effectiveInStock,
  };

  const showLowStock =
    effectiveStockCount !== null &&
    effectiveStockCount > 0 &&
    effectiveStockCount <= product.lowStockAlert;

  return (
    <>
      <div className="space-y-4">
        {/* Variant selector */}
        {variants.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.05em] text-steel-500">Select variant</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const isSelected = variant.id === selectedVariantId;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`border px-3 py-1.5 font-mono text-xs tracking-[0.03em] transition-colors ${
                      isSelected
                        ? "border-iron-800 bg-iron-800 text-alloy-white"
                        : "border-steel-500/40 bg-alloy-white text-iron-800 hover:border-iron-800"
                    } ${!variant.inStock ? "opacity-50" : ""}`}
                  >
                    {variant.name}
                    {!variant.inStock && (
                      <span className="ml-1.5 text-[0.6rem] uppercase tracking-[0.05em] opacity-70">
                        · Out of stock
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedVariant?.priceInPaise != null && (
              <p className="font-mono text-sm text-steel-500">
                Variant price:{" "}
                <Price valueInPaise={selectedVariant.priceInPaise} className="text-iron-800" />
              </p>
            )}
          </div>
        )}

        {/* Low stock warning */}
        {showLowStock && (
          <div className="inline-flex items-center gap-1.5 border border-safety-orange/40 bg-safety-orange/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-safety-orange" />
            <span className="font-mono text-xs font-medium tracking-[0.03em] text-safety-orange">
              Only {effectiveStockCount} left in stock
            </span>
          </div>
        )}

        {/* Purchase controls */}
        {effectiveInStock ? (
          <div className="space-y-3">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={effectiveStockCount ?? 99}
              disabled={false}
            />
            <div ref={mainButtonRef}>
              <AddToCartButton product={cartProduct} quantity={quantity} />
            </div>
          </div>
        ) : (
          <StockNotifyForm productId={product.id} initialEmail={initialEmail} />
        )}

        {/* Quote request form */}
        <QuoteRequestForm productId={product.id} initialQuantity={quantity} />
      </div>

      {/* Mobile sticky bar — only shows when main button scrolls out of view */}
      <StickyAddToCart product={cartProduct} mainButtonRef={mainButtonRef} />
    </>
  );
}
