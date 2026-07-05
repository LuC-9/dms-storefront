import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [totalProducts, totalCategories, totalEmployees, salaryAggregate, refundsThisMonth] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.employee.count(),
    prisma.salaryRecord.aggregate({
      _sum: { netPaid: true },
      where: {
        paidAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    }),
    prisma.refund.aggregate({
      _count: { _all: true },
      _sum: { amountInPaise: true },
      where: {
        status: { not: "FAILED" },
        createdAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    }),
  ]);

  return NextResponse.json({
    totalProducts,
    totalCategories,
    totalEmployees,
    totalSalaryPaidThisMonth: salaryAggregate._sum.netPaid ?? 0,
    refundsThisMonth: {
      count: refundsThisMonth._count._all,
      totalInPaise: refundsThisMonth._sum.amountInPaise ?? 0,
    },
  });
}
