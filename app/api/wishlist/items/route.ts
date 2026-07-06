import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";
import { WishlistItemSchema } from "@/lib/validators";

async function getOrCreateDefaultWishlistId(userId: string): Promise<string> {
  const wishlist = await prisma.wishlist.upsert({
    where: { userId_name: { userId, name: "My List" } },
    update: {},
    create: { userId, name: "My List" },
    select: { id: true },
  });
  return wishlist.id;
}

export async function POST(request: NextRequest) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  let payload: z.infer<typeof WishlistItemSchema>;
  try {
    payload = WishlistItemSchema.parse(await request.json().catch(() => null));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid request body", issues: error.issues } },
        { status: 400 },
      );
    }
    throw error;
  }

  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
    select: { id: true },
  });
  if (!product) {
    return errorResponse("NOT_FOUND", "Product not found", 404);
  }

  const wishlistId = await getOrCreateDefaultWishlistId(session.user.id);

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId, productId: payload.productId } },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "Product is already in your wishlist" } },
      { status: 409 },
    );
  }

  const item = await prisma.wishlistItem.create({
    data: { wishlistId, productId: payload.productId },
    select: { id: true },
  });

  return NextResponse.json({ wishlistItemId: item.id }, { status: 201 });
}
