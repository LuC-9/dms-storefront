"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/storefront/cart-context";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import { Price } from "@/components/storefront/price";
import { SpecPlate } from "@/components/storefront/spec-plate";
import { getSkuLabel } from "@/components/storefront/product-spec";

export function CartPageContent() {
  const { items, itemCount, subtotalInPaise, updateItem, removeItem, clear } = useCart();

  return (
    <div className="container space-y-6 py-8 md:py-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Cart</h1>
          <p className="mt-1 text-sm text-steel-500">
            {itemCount > 0
              ? `${itemCount} item${itemCount === 1 ? "" : "s"} in cart`
              : "Your cart is empty. Add parts from the catalogue."}
          </p>
        </div>
        {items.length > 0 ? (
          <Button variant="ghost" className="rounded-none text-sm" onClick={() => void clear()}>
            Clear cart
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="border border-steel-500/30 bg-alloy-white p-8 text-center">
          <p className="text-sm text-steel-500">Your cart is empty. Add parts from the catalogue.</p>
          <Button
            asChild
            className="mt-3 rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
          >
            <Link href="/catalogue">Browse catalogue</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 pb-24 lg:grid-cols-[1fr_320px] lg:pb-0">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id ?? item.productId}
                className="flex flex-col gap-4 border border-steel-500/25 bg-alloy-white p-4 sm:flex-row"
              >
                <div className="relative h-24 w-24 overflow-hidden border border-steel-500/25">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1">
                  <Link
                    href={item.slug ? `/products/${item.slug}` : "/catalogue"}
                    className="font-display text-xl font-semibold tracking-[0.02em]"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-steel-500">
                    Unit: <Price valueInPaise={item.priceInPaise} />
                  </p>
                  <SpecPlate
                    lines={[`[${getSkuLabel({ name: item.name, sku: null })}]`]}
                    className="mt-2 inline-flex p-1.5 text-2xs leading-4"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(next) => void updateItem({ id: item.id, productId: item.productId }, next)}
                    />
                    <p className="text-base">
                      <Price valueInPaise={item.priceInPaise * item.quantity} className="text-base" />
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="self-start rounded-none text-safety-orange hover:bg-blueprint-100 hover:text-safety-orange"
                  onClick={() => void removeItem({ id: item.id, productId: item.productId })}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <aside className="sticky top-20 hidden h-fit border border-steel-500/25 bg-alloy-white p-4 lg:block">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Order summary</h2>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-steel-500">Subtotal</span>
              <Price valueInPaise={subtotalInPaise} className="font-medium" />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-steel-500">Shipping</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="mt-4 border-t border-steel-500/25 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <Price valueInPaise={subtotalInPaise} className="text-lg" />
              </div>
            </div>
            <Button
              asChild
              className="mt-4 w-full rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
            >
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
          </aside>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-steel-500/25 bg-alloy-white p-3 lg:hidden">
            <div className="container flex items-center justify-between gap-3 p-0">
              <div>
                <p className="text-xs text-steel-500">Total</p>
                <Price valueInPaise={subtotalInPaise} className="text-base" />
              </div>
              <Button
                asChild
                className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
              >
                <Link href="/checkout">Checkout</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
