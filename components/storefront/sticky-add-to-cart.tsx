"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/storefront/cart-context";
import { toast } from "@/components/ui/toast";
import { Price } from "@/components/storefront/price";

type StickyAddToCartProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    priceInPaise: number;
    inStock: boolean;
  };
  /** Ref to the main "Add to Cart" button on desktop so we can hide when it's visible */
  mainButtonRef: React.RefObject<HTMLElement | null>;
};

export function StickyAddToCart({ product, mainButtonRef }: StickyAddToCartProps) {
  const { addItem, openDrawer } = useCart();
  const [visible, setVisible] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const target = mainButtonRef.current;
    if (!target) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [mainButtonRef]);

  if (!product.inStock) return null;

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-steel-500/30 bg-forge-950 px-4 py-3 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold uppercase tracking-[0.02em] text-alloy-white">
            {product.name}
          </p>
          <Price valueInPaise={product.priceInPaise} className="text-xs text-steel-500" />
        </div>
        <button
          type="button"
          disabled={adding}
          onClick={async () => {
            setAdding(true);
            try {
              await addItem(product, 1);
              window.dispatchEvent(new CustomEvent("cart:item-added"));
              toast({
                title: "Added to cart",
                description: product.name,
                actionLabel: "View cart",
                onAction: openDrawer,
              });
            } finally {
              setAdding(false);
            }
          }}
          className="shrink-0 border border-safety-orange bg-safety-orange px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
