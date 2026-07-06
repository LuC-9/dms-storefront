import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonth(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const now = new Date();

  // Last 12 months window
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Last 90 days window
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [completedOrders, allOrders, topOrderItems, lowStockProducts] = await Promise.all([
    // Completed orders in last 12 months for revenue grouping
    prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        createdAt: true,
        totalInPaise: true,
      },
    }),

    // All orders grouped by status
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),

    // Top products by order count in last 90 days
    prisma.orderItem.groupBy({
      by: ["productId"],
      _count: { _all: true },
      _sum: { lineTotalInPaise: true },
      where: {
        order: {
          createdAt: { gte: ninetyDaysAgo },
        },
      },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),

    // Low stock products
    prisma.product.findMany({
      where: {
        stockCount: { not: null },
        AND: [
          { stockCount: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        stockCount: true,
        lowStockAlert: true,
      },
    }),
  ]);

  // Group completed orders by month using JS (SQLite-compatible)
  const revenueMap = new Map<string, { revenueInPaise: number; orderCount: number }>();

  // Pre-populate the last 12 months with zero values
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenueMap.set(formatMonth(d), { revenueInPaise: 0, orderCount: 0 });
  }

  for (const order of completedOrders) {
    const key = formatMonth(new Date(order.createdAt));
    const existing = revenueMap.get(key);
    if (existing) {
      existing.revenueInPaise += order.totalInPaise;
      existing.orderCount += 1;
    }
  }

  const revenueByMonth = Array.from(revenueMap.entries()).map(([month, data]) => ({
    month,
    revenueInPaise: data.revenueInPaise,
    orderCount: data.orderCount,
  }));

  // Orders by status
  const ordersByStatus = allOrders.map((row) => ({
    status: row.status,
    count: row._count._all,
  }));

  // Fetch product names for top products
  const topProductIds = topOrderItems.map((item) => item.productId);
  const topProductRecords = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });

  const productNameMap = new Map(topProductRecords.map((p) => [p.id, p.name]));

  const topProducts = topOrderItems.map((item) => ({
    name: productNameMap.get(item.productId) ?? item.productId,
    orderCount: item._count._all,
    revenueInPaise: item._sum.lineTotalInPaise ?? 0,
  }));

  // Filter low stock products in JS (stockCount <= lowStockAlert)
  const filteredLowStock = lowStockProducts.filter(
    (p) => p.stockCount !== null && p.stockCount <= p.lowStockAlert,
  );

  return NextResponse.json({
    revenueByMonth,
    ordersByStatus,
    topProducts,
    lowStockProducts: filteredLowStock,
  });
}
