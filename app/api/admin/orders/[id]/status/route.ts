import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";
import { OrderStatusUpdateSchema } from "@/lib/validators";
import { getAdminOrderDetailsById } from "@/lib/admin-orders";
import {
  applyTransitionTimestamps,
  assertTransition,
  OrderStateError,
} from "@/lib/state-machine";
import { errorResponse } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }
  if (session.user.role === "EMPLOYEE" || session.user.role === "customer") {
    return errorResponse("FORBIDDEN", "Insufficient permissions", 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = OrderStatusUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid status payload", 400);
  }

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      notes: true,
    },
  });
  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  const isStatusChange = parsed.data.status !== order.status;
  if (isStatusChange) {
    try {
      assertTransition(order.status, parsed.data.status, session.user.role);
    } catch (error) {
      if (error instanceof OrderStateError) {
        return errorResponse(error.code, error.message, 409);
      }
      throw error;
    }
  }

  const nextNotes = parsed.data.notes?.trim()
    ? [order.notes?.trim(), parsed.data.notes.trim()].filter(Boolean).join("\n")
    : order.notes;
  const trackingUrl =
    parsed.data.status === "SHIPPED" && parsed.data.trackingUrl
      ? parsed.data.trackingUrl.trim()
      : undefined;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: parsed.data.status,
      notes: nextNotes,
      ...(trackingUrl ? { trackingUrl } : {}),
      ...(isStatusChange ? applyTransitionTimestamps(order, parsed.data.status) : {}),
    },
  });

  const fullOrder = await getAdminOrderDetailsById(updated.id);
  if (!fullOrder) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }
  return NextResponse.json({ order: fullOrder });
}
