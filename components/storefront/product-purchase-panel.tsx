"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { StockNotifyForm } from "@/components/storefront/stock-notify-form";

type ProductPurchasePanelProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    priceInPaise: number;
    inStock: boolean;
  };
  initialEmail?: string | null;
};

export function ProductPurchasePanel({ product, initialEmail }: ProductPurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product.inStock) {
    return <StockNotifyForm productId={product.id} initialEmail={initialEmail} />;
  }

  return (
    <div className="space-y-3">
      <QuantityStepper value={quantity} onChange={setQuantity} disabled={false} />
      <AddToCartButton product={product} quantity={quantity} />
    </div>
  );
}
