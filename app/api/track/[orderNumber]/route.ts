import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseOrderAddress } from "@/lib/orders";
import { errorResponse } from "@/lib/api";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { orderNumber } = await context.params;
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return errorResponse("EMAIL_REQUIRED", "Email query parameter is required", 400);
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      OR: [{ guestEmail: email }, { user: { email } }],
    },
    include: {
      user: { select: { email: true } },
      items: {
        select: {
          id: true,
          productNameSnapshot: true,
          productSlugSnapshot: true,
          quantity: true,
          lineTotalInPaise: true,
        },
      },
    },
  });

  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  const shippingAddress = parseOrderAddress(order);

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalInPaise: order.totalInPaise,
    currency: order.currency,
    createdAt: order.createdAt,
    trackingUrl: order.trackingUrl,
    shipping: {
      city: shippingAddress.city,
      state: shippingAddress.state,
    },
    timeline: {
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    },
    items: order.items,
  });
}
