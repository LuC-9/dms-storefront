import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { parsePositiveInt, errorResponse } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 10, 50);
  const cursor = request.nextUrl.searchParams.get("cursor");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  const hasMore = orders.length > limit;
  const page = hasMore ? orders.slice(0, limit) : orders;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  return NextResponse.json({
    items: page.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      totalInPaise: order.totalInPaise,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      itemCount: order._count.items,
    })),
    nextCursor,
  });
}
