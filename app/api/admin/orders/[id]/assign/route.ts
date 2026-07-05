import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminOrderDetailsById } from "@/lib/admin-orders";
import { errorResponse } from "@/lib/api";

const AssignSchema = z.object({
  assignedAdminId: z.string().cuid().nullable(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return errorResponse("FORBIDDEN", "Only SUPER_ADMIN and ADMIN can assign orders", 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = AssignSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid assign payload", 400);
  }

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  if (parsed.data.assignedAdminId) {
    const admin = await prisma.adminUser.findUnique({
      where: { id: parsed.data.assignedAdminId },
      select: { id: true },
    });
    if (!admin) {
      return errorResponse("ADMIN_NOT_FOUND", "Assigned admin not found", 404);
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { assignedAdminId: parsed.data.assignedAdminId },
  });

  const fullOrder = await getAdminOrderDetailsById(updated.id);
  if (!fullOrder) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }
  return NextResponse.json({ order: fullOrder });
}
