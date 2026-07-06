import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";

async function getOrCreateDefaultWishlist(userId: string) {
  return prisma.wishlist.upsert({
    where: { userId_name: { userId, name: "My List" } },
    update: {},
    create: { userId, name: "My List" },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              imageUrl: true,
              priceInPaise: true,
              inStock: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const wishlist = await getOrCreateDefaultWishlist(session.user.id);

  return NextResponse.json({
    wishlistId: wishlist.id,
    items: wishlist.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: item.product,
    })),
  });
}
