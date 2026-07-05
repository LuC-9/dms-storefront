import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";
import { OrderCancelSchema } from "@/lib/validators";
import { cancelOrderAsCustomer, RefundValidationError } from "@/lib/refunds";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = OrderCancelSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Reason is required and must be under 500 characters", 400);
  }

  const { orderNumber } = await context.params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true, userId: true },
  });

  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  if (order.userId !== session.user.id) {
    return errorResponse("FORBIDDEN", "You are not allowed to cancel this order", 403);
  }

  try {
    const result = await cancelOrderAsCustomer({
      orderId: order.id,
      userId: session.user.id,
      reason: parsed.data.reason,
      customerEmail: session.user.email ?? "customer",
    });

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        status: true,
        cancelledAt: true,
        cancellationReason: true,
        refunds: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            amountInPaise: true,
            type: true,
            status: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    return Response.json({
      ok: true,
      order: {
        status: updated?.status ?? "CANCELLED",
        cancelledAt: updated?.cancelledAt ?? null,
        cancellationReason: updated?.cancellationReason ?? parsed.data.reason,
      },
      refund: result.refundCreated ? (updated?.refunds[0] ?? null) : null,
    });
  } catch (error) {
    if (error instanceof RefundValidationError) {
      if (error.code === "INVALID_STATUS_FOR_CUSTOMER_CANCEL") {
        return errorResponse(error.code, error.message, 409);
      }
      if (error.code === "ORDER_NOT_FOUND") {
        return errorResponse(error.code, error.message, 404);
      }
      return errorResponse(error.code, error.message, 422);
    }
    console.error("Customer cancel failed", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to cancel order", 500);
  }
}
