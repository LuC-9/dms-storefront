"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/components/storefront/cart-context";
import { SPRING_SNAP } from "@/lib/motion-presets";

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
  const { addItem, updateItem, removeItem, openDrawer, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = items.find((item) => item.productId === product.id);
  const inCart = Boolean(cartItem);

  if (!product.inStock) {
    return (
      <Badge className="border border-steel-500/30 bg-blueprint-100 text-xs font-medium text-iron-800">
        Out of stock — call to enquire
      </Badge>
    );
  }

  async function handleAdd() {
    await addItem(product, quantity);
    window.dispatchEvent(new CustomEvent("cart:item-added"));
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
    toast({
      title: "Added to cart",
      description: quantity > 1 ? `${product.name} ×${quantity}` : product.name,
      actionLabel: "View cart",
      onAction: openDrawer,
    });
  }

  async function handleIncrement() {
    if (!cartItem) return;
    await updateItem(cartItem, cartItem.quantity + 1);
    window.dispatchEvent(new CustomEvent("cart:item-added"));
  }

  async function handleDecrement() {
    if (!cartItem) return;
    if (cartItem.quantity <= 1) {
      await removeItem(cartItem);
    } else {
      await updateItem(cartItem, cartItem.quantity - 1);
    }
  }

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait" initial={false}>
        {!inCart ? (
          <motion.button
            key="add"
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRING_SNAP}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => void handleAdd()}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-safety-orange py-3 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-all hover:bg-accent-600"
          >
            <span className="absolute inset-0 -translate-x-full bg-white/15 transition-transform duration-500 group-hover:translate-x-full" />
            <Plus className="h-4 w-4" />
            Add to cart
          </motion.button>
        ) : (
          <motion.div
            key="stepper"
            layout
            initial={{ opacity: 0, scaleX: 0.8, originX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.8 }}
            transition={SPRING_SNAP}
            className="flex w-full items-stretch overflow-hidden rounded-lg bg-surface-muted ring-1 ring-steel-300"
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => void handleDecrement()}
              className="flex flex-1 items-center justify-center bg-blueprint-100/50 text-iron-800 hover:bg-blueprint-100"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </motion.button>
            <motion.span
              key={cartItem?.quantity}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_SNAP}
              className="flex min-w-[2.5rem] items-center justify-center border-x border-safety-orange/30 font-bold text-iron-800"
            >
              {cartItem?.quantity}
            </motion.span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => void handleIncrement()}
              className="flex flex-1 items-center justify-center bg-safety-orange text-alloy-white hover:bg-safety-orange/90"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {justAdded && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="absolute -top-7 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.12em] text-safety-orange"
          >
            <Check className="h-3 w-3" /> Added
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
