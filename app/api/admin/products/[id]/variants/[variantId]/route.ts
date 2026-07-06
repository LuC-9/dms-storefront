import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";

const updateVariantSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional().nullable(),
  priceInPaise: z.number().int().positive().optional().nullable(),
  stockCount: z.number().int().min(0).optional().nullable(),
  inStock: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

async function resolveVariant(productId: string, variantId: string) {
  return prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id, variantId } = await params;

  const existing = await resolveVariant(id, variantId);
  if (!existing) {
    return errorResponse("NOT_FOUND", "Variant not found", 404);
  }

  const body = await request.json();
  const parsed = updateVariantSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid payload", 400, { issues: parsed.error.issues });
  }

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: parsed.data,
  });

  return NextResponse.json(variant);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id, variantId } = await params;

  const existing = await resolveVariant(id, variantId);
  if (!existing) {
    return errorResponse("NOT_FOUND", "Variant not found", 404);
  }

  await prisma.productVariant.delete({ where: { id: variantId } });

  return NextResponse.json({ success: true });
}
