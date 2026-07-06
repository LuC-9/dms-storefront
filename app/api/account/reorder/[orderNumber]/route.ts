import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";
import { addItemToCart, CartError } from "@/lib/cart";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { orderNumber } = await context.params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        select: {
          productId: true,
          productNameSnapshot: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  if (order.userId !== session.user.id) {
    return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  let added = 0;
  const skipped: string[] = [];

  for (const item of order.items) {
    try {
      await addItemToCart({
        userId: session.user.id,
        productId: item.productId,
        quantity: item.quantity,
      });
      added++;
    } catch (err) {
      if (err instanceof CartError) {
        skipped.push(item.productNameSnapshot);
      } else {
        throw err;
      }
    }
  }

  return NextResponse.json({ added, skipped });
}
