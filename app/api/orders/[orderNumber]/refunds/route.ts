import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";
import { getRefundableRemainingInPaise, getRefundedTotalInPaise } from "@/lib/refunds";

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
    select: {
      userId: true,
      totalInPaise: true,
      refunds: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }
  if (order.userId !== session.user.id) {
    return errorResponse("FORBIDDEN", "You are not allowed to view this order", 403);
  }

  return Response.json({
    refunds: order.refunds,
    totalRefundedInPaise: getRefundedTotalInPaise(order),
    remainingRefundableInPaise: getRefundableRemainingInPaise(order),
  });
}
