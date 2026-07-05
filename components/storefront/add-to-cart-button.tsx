"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/components/storefront/cart-context";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    priceInPaise: number;
    inStock: boolean;
  };
  quantity?: number;
};

export function AddToCartButton({ product, quantity = 1 }: AddToCartButtonProps) {
  const { addItem, openDrawer } = useCart();

  if (!product.inStock) {
    return (
      <Badge className="border border-steel-500/30 bg-blueprint-100 text-xs font-medium text-iron-800">
        ○ Out of stock - call to enquire
      </Badge>
    );
  }

  return (
    <Button
      type="button"
      className="w-full rounded-none border border-safety-orange bg-safety-orange font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
      onClick={async () => {
        await addItem(product, quantity);
        window.dispatchEvent(new CustomEvent("cart:item-added"));
        toast({
          title: "Added to cart",
          description: quantity > 1 ? `${product.name} x${quantity}` : product.name,
          actionLabel: "View cart",
          onAction: openDrawer,
        });
      }}
    >
      Add to cart
    </Button>
  );
}
