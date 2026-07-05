import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { categorySchema } from "@/lib/validators";

export async function PUT(
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
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { id } = await params;
  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN");
  if (!session) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient role" } },
      { status: 403 },
    );
  }

  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
