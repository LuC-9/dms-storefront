import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac";
import { getAdminOrderDetailsById } from "@/lib/admin-orders";
import { errorResponse } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;
  const order = await getAdminOrderDetailsById(id);

  if (!order) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  return NextResponse.json(order);
}
