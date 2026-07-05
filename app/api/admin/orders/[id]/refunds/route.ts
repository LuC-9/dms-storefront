import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";
import { getRefundableRemainingInPaise, getRefundedTotalInPaise } from "@/lib/refunds";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      totalInPaise: true,
      refunds: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  return Response.json({
    refunds: order.refunds,
    totalRefundedInPaise: getRefundedTotalInPaise(order),
    remainingRefundableInPaise: getRefundableRemainingInPaise(order),
  });
}
