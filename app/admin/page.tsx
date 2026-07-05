import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/admin/stat-card";
import { formatInr } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const now = new Date();
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    totalProducts,
    totalCategories,
    totalEmployees,
    salaryAggregate,
    totalOrdersLast30Days,
    pendingOrdersCount,
    shippedOrdersCount,
    monthlyRevenueAggregate,
    refundsThisMonth,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.employee.count(),
    prisma.salaryRecord.aggregate({
      _sum: { netPaid: true },
      where: { paidAt: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.order.count({ where: { createdAt: { gte: last30Days } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.aggregate({
      _sum: { totalInPaise: true },
      where: {
        paymentStatus: "COMPLETED",
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.refund.aggregate({
      _count: { _all: true },
      _sum: { amountInPaise: true },
      where: {
        status: { not: "FAILED" },
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Orders (Last 30 Days)" value={totalOrdersLast30Days} />
        <StatCard title="Pending Orders" value={pendingOrdersCount} />
        <StatCard title="Shipped Orders" value={shippedOrdersCount} />
        <StatCard
          title="Revenue (This Month)"
          value={formatInr(monthlyRevenueAggregate._sum.totalInPaise ?? 0)}
        />
        <StatCard
          title="Refunds this month"
          value={`${refundsThisMonth._count._all} (${formatInr(refundsThisMonth._sum.amountInPaise ?? 0)})`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={totalProducts} />
        <StatCard title="Total Categories" value={totalCategories} />
        <StatCard title="Total Employees" value={totalEmployees} />
        <StatCard
          title="Salary Paid (This Month)"
          value={formatInr(salaryAggregate._sum.netPaid ?? 0)}
        />
      </div>
    </div>
  );
}
