import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { salarySchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const salaries = await prisma.salaryRecord.findMany({
    where: { employeeId: id },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json(salaries);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN");
  if (!session) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient role" } },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = salarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { id } = await params;
  const salary = await prisma.salaryRecord.create({
    data: {
      ...parsed.data,
      employeeId: id,
    },
  });
  return NextResponse.json(salary, { status: 201 });
}
