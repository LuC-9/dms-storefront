import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { parseOrderAddress } from "@/lib/orders";
import { errorResponse } from "@/lib/api";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { orderNumber } = await context.params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order || order.userId !== session.user.id) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotalInPaise: order.subtotalInPaise,
    shippingInPaise: order.shippingInPaise,
    taxInPaise: order.taxInPaise,
    totalInPaise: order.totalInPaise,
    currency: order.currency,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    confirmedAt: order.confirmedAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    trackingUrl: order.trackingUrl,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
    cancelledBy: order.cancelledBy,
    shippingAddress: parseOrderAddress(order),
    items: order.items,
    paymentSummary: {
      status: order.paymentStatus,
      latestPayment: order.payments[0] ?? null,
      payments: order.payments.map((payment) => ({
        id: payment.id,
        provider: payment.provider,
        amountInPaise: payment.amountInPaise,
        currency: payment.currency,
        status: payment.status,
        providerOrderId: payment.providerOrderId,
        providerPaymentId: payment.providerPaymentId,
        createdAt: payment.createdAt,
      })),
    },
  });
}
