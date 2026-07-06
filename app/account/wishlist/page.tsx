import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { requireCustomerSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Price } from "@/components/storefront/price";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { WishlistRemoveButton } from "@/components/storefront/wishlist-remove-button";

export default async function AccountWishlistPage() {
  const session = await requireCustomerSession();
  if (!session) redirect("/login?callbackUrl=/account/wishlist");

  const wishlist = await prisma.wishlist.findFirst({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: { category: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const items = wishlist?.items ?? [];

  return (
    <div className="border border-steel-500/25 bg-alloy-white p-4">
      <div className="flex items-center gap-3">
        <Heart className="h-5 w-5 text-safety-orange" />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Wishlist</h1>
          <p className="text-sm text-steel-500">Items you&apos;ve saved for later.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 border border-steel-500/30 p-8 text-center">
          <Heart className="mx-auto h-8 w-8 text-steel-300" />
          <p className="mt-3 font-display text-xl font-semibold text-iron-800">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-steel-500">Browse the catalogue to save items.</p>
          <Link
            href="/catalogue"
            className="mt-4 inline-block border border-safety-orange bg-safety-orange px-5 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
          >
            Browse catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ product }) => (
            <article key={product.id} className="flex flex-col border border-steel-500/25 bg-white">
              <div className="relative h-36 overflow-hidden bg-blueprint-100">
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
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
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-steel-500">
                  {product.category?.name ?? "Industrial components"}
                </p>
                <h3 className="font-display text-base font-semibold leading-tight">{product.name}</h3>
                <p className="line-clamp-2 text-xs text-steel-500">{product.description}</p>
                <Price valueInPaise={product.priceInPaise} className="mt-auto text-sm font-medium" />
                <div className="mt-2 space-y-2">
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
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-xs text-iron-800 underline-offset-2 hover:underline"
                    >
                      View details →
                    </Link>
                    <WishlistRemoveButton productId={product.id} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
