import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonth(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export default async function AdminAnalyticsPage() {
  const session = await requireAdminSession();
  if (!session) notFound();

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [completedOrders, allOrders, topOrderItems, lowStockAll] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true, totalInPaise: true },
    }),

    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),

    prisma.orderItem.groupBy({
      by: ["productId"],
      _count: { _all: true },
      _sum: { lineTotalInPaise: true },
      where: { order: { createdAt: { gte: ninetyDaysAgo } } },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),

    prisma.product.findMany({
      where: { stockCount: { not: null } },
      select: { id: true, name: true, slug: true, stockCount: true, lowStockAlert: true },
    }),
  ]);

  // Build revenue map pre-populated with last 12 months of zeroes
  const revenueMap = new Map<string, { revenueInPaise: number; orderCount: number }>();
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
    revenueInRupees: Math.round(data.revenueInPaise / 100),
    orderCount: data.orderCount,
  }));

  const ordersByStatus = allOrders.map((row) => ({
    status: row.status as string,
    count: row._count._all,
  }));

  const topProductIds = topOrderItems.map((item) => item.productId);
  const topProductRecords =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true },
        })
      : [];

  const productNameMap = new Map(topProductRecords.map((p) => [p.id, p.name]));
  const topProducts = topOrderItems.map((item) => ({
    name: (() => {
      const n = productNameMap.get(item.productId) ?? item.productId;
      return n.length > 28 ? `${n.slice(0, 26)}…` : n;
    })(),
    orderCount: item._count._all,
    revenueInPaise: item._sum.lineTotalInPaise ?? 0,
  }));

  const lowStockProducts = lowStockAll.filter(
    (p) => p.stockCount !== null && p.stockCount <= p.lowStockAlert,
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <AnalyticsCharts
        revenueByMonth={revenueByMonth}
        ordersByStatus={ordersByStatus}
        topProducts={topProducts}
      />

      {/* Low Stock Table */}
      <div className="rounded-md border border-steel-200 bg-white">
        <div className="border-b border-steel-200 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-steel-600">
            Low Stock Products
          </h2>
        </div>
        {lowStockProducts.length === 0 ? (
          <p className="px-4 py-6 text-sm text-steel-500">All products are adequately stocked.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-steel-200 bg-steel-50">
                  <th className="px-4 py-3 text-left font-medium text-steel-700">Product</th>
                  <th className="px-4 py-3 text-right font-medium text-steel-700">In Stock</th>
                  <th className="px-4 py-3 text-right font-medium text-steel-700">Alert At</th>
                  <th className="px-4 py-3 text-right font-medium text-steel-700">Value (@ price)</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-b border-steel-100 last:border-0 hover:bg-steel-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">
                      {p.stockCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-steel-600">
                      {p.lowStockAlert}
                    </td>
                    <td className="px-4 py-3 text-right text-steel-500">
                      —
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
