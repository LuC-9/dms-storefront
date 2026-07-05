import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";
import { errorResponse, parsePositiveInt } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const validStatuses = new Set(Object.values(OrderStatus));
  const status =
    statusParam && validStatuses.has(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const assignedTo = request.nextUrl.searchParams.get("assignedTo");
  const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 20, 100);
  const cursor = request.nextUrl.searchParams.get("cursor");

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { startsWith: q } },
              { user: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(assignedTo === "me" ? { assignedAdminId: session.user.id } : {}),
    },
    include: {
      refunds: {
        select: {
          amountInPaise: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = orders.length > limit;
  const page = hasMore ? orders.slice(0, limit) : orders;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  return NextResponse.json({
    items: page.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user?.name ?? null,
      customerEmail: order.user?.email ?? order.guestEmail ?? null,
      itemCount: order._count.items,
      totalInPaise: order.totalInPaise,
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingUrl: order.trackingUrl,
      createdAt: order.createdAt,
      assignedAdminId: order.assignedAdminId,
      refundedInPaise: order.refunds.reduce((total, refund) => {
        if (refund.status === "FAILED") {
          return total;
        }
        return total + refund.amountInPaise;
      }, 0),
    })),
    nextCursor,
  });
}
