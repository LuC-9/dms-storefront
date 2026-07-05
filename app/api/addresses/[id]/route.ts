import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { AddressUpdateSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = AddressUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid address payload", 400);
  }

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return errorResponse("NOT_FOUND", "Address not found", 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({
        where: { userId: session.user.id, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id },
      data: parsed.data,
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;
  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return errorResponse("NOT_FOUND", "Address not found", 404);
  }

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
