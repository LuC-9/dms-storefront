import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { employeeSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { salaries: true, attendance: true } } },
  });
  return NextResponse.json(employees);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN");
  if (!session) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient role" } },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: {
      ...parsed.data,
      joinDate: new Date(parsed.data.joinDate),
    },
  });
  return NextResponse.json(employee, { status: 201 });
}
