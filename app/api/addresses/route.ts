import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { AddressInputSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/api";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ items: addresses });
}

export async function POST(request: Request) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = AddressInputSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid address payload", 400);
  }

  const created = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId: session.user.id,
        label: parsed.data.label,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
        isDefault: parsed.data.isDefault ?? false,
      },
    });
  });

  return NextResponse.json(created, { status: 201 });
}
