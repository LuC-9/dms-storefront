import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";

const createVariantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  priceInPaise: z.number().int().positive().optional().nullable(),
  stockCount: z.number().int().min(0).optional().nullable(),
  inStock: z.boolean(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;

  const productExists = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!productExists) {
    return errorResponse("NOT_FOUND", "Product not found", 404);
  }

  const body = await request.json();
  const parsed = createVariantSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid payload", 400, { issues: parsed.error.issues });
  }

  const variant = await prisma.productVariant.create({
    data: {
      productId: id,
      name: parsed.data.name,
      sku: parsed.data.sku ?? null,
      priceInPaise: parsed.data.priceInPaise ?? null,
      stockCount: parsed.data.stockCount ?? null,
      inStock: parsed.data.inStock,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  return NextResponse.json(variant, { status: 201 });
}
