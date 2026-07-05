import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";
import { AdminRefundSchema } from "@/lib/validators";
import {
  assertRefundAmountValid,
  createRefundTx,
  getRefundableRemainingInPaise,
  RefundValidationError,
} from "@/lib/refunds";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return errorResponse("FORBIDDEN", "Only SUPER_ADMIN and ADMIN can issue refunds", 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = AdminRefundSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid refund payload", 400);
  }

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      totalInPaise: true,
      refunds: {
        select: {
          amountInPaise: true,
          status: true,
        },
      },
    },
  });
  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  const remaining = getRefundableRemainingInPaise(order);
  if (parsed.data.type === "FULL" && parsed.data.amountInPaise !== remaining) {
    return errorResponse("FULL_REFUND_AMOUNT_MISMATCH", "Full refund must match remaining refundable amount", 422);
  }

  try {
    if (parsed.data.type === "PARTIAL") {
      assertRefundAmountValid(order, parsed.data.amountInPaise);
    }

    if (parsed.data.cancelOrder && order.status === "DELIVERED") {
      return errorResponse("ORDER_ALREADY_DELIVERED", "Delivered orders cannot be cancelled", 409);
    }

    const result = await createRefundTx({
      orderId: order.id,
      type: parsed.data.type,
      amountInPaise: parsed.data.amountInPaise,
      reason: parsed.data.reason,
      initiatedBy: session.user.username ?? session.user.name ?? session.user.id,
      cancelOrder: parsed.data.cancelOrder,
      cancellationReason: parsed.data.reason,
    });

    return Response.json({
      ok: true,
      refund: result.refund,
      orderCancelled: result.orderCancelled,
      paymentMarkedRefunded: result.paymentMarkedRefunded,
    });
  } catch (error) {
    if (error instanceof RefundValidationError) {
      if (error.code === "ORDER_ALREADY_DELIVERED") {
        return errorResponse(error.code, error.message, 409);
      }
      return errorResponse(error.code, error.message, 422);
    }
    console.error("Admin refund failed", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create refund", 500);
  }
}
