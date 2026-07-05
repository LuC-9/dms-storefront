"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/components/storefront/cart-context";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { Price } from "@/components/storefront/price";
import { SpecPlate } from "@/components/storefront/spec-plate";
import { getSkuLabel } from "@/components/storefront/product-spec";

export function CartDrawer() {
  const { isOpen, openDrawer, closeDrawer, items, itemCount, subtotalInPaise, updateItem, removeItem } =
    useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? openDrawer() : closeDrawer())}>
      <SheetContent
        side="right"
        className="flex h-full flex-col border-steel-500/25 bg-alloy-white p-0 shadow-2xl duration-[180ms] ease-out data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
      >
        <SheetHeader className="border-b border-steel-500/25 bg-iron-800 px-5 py-4 text-alloy-white">
          <SheetTitle className="font-display text-xl font-semibold uppercase tracking-[0.05em] text-alloy-white">
            Cart
          </SheetTitle>
          <SheetDescription>
            <span className="text-blueprint-100">
              {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? "" : "s"}` : "No items yet"}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="border border-steel-500/30 p-5 text-center">
              <p className="text-sm text-steel-500">Your cart is empty. Add parts from the catalogue.</p>
              <Button
                asChild
                size="sm"
                className="mt-3 rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
              >
                <Link href="/catalogue" onClick={closeDrawer}>
                  Browse catalogue
                </Link>
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id ?? item.productId} className="border border-steel-500/25 bg-alloy-white p-3">
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 overflow-hidden border border-steel-500/25">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      href={item.slug ? `/products/${item.slug}` : "/catalogue"}
                      onClick={closeDrawer}
                      className="line-clamp-1 font-display text-sm font-semibold tracking-[0.02em] text-iron-800"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-steel-500">
                      Unit: <Price valueInPaise={item.priceInPaise} />
                    </p>
                    <SpecPlate
                      lines={[`[${getSkuLabel({ name: item.name, sku: null })}]`]}
                      className="inline-flex p-1 text-2xs leading-4"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(next) => void updateItem({ id: item.id, productId: item.productId }, next)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-none text-safety-orange hover:bg-blueprint-100 hover:text-safety-orange"
                    onClick={() => void removeItem({ id: item.id, productId: item.productId })}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <SheetFooter className="sticky bottom-0 border-t border-steel-500/25 bg-alloy-white px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-steel-500">Subtotal</span>
            <span className="font-semibold text-iron-800">
              <Price valueInPaise={subtotalInPaise} />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="rounded-none border-forge-950 text-forge-950">
              <Link href="/cart" onClick={closeDrawer}>
                View cart
              </Link>
            </Button>
            <Button
              asChild
              disabled={items.length === 0}
              className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
            >
              <Link href="/checkout" onClick={closeDrawer}>
                Checkout
              </Link>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
