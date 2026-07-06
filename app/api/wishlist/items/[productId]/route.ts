import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { productId } = await context.params;

  const deleted = await prisma.wishlistItem.deleteMany({
    where: {
      productId,
      wishlist: { userId: session.user.id },
    },
  });

  if (deleted.count === 0) {
    return errorResponse("NOT_FOUND", "Item not found in wishlist", 404);
  }

  return NextResponse.json({ success: true });
}
