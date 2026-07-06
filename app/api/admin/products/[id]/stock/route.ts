import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";

const stockUpdateSchema = z.object({
  stockCount: z.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
  lowStockAlert: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN", "MANAGER");
  if (!session) {
    return errorResponse("FORBIDDEN", "Insufficient role", 403);
  }

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!product) {
    return errorResponse("NOT_FOUND", "Product not found", 404);
  }

  const body = await request.json();
  const parsed = stockUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid payload", 400, { issues: parsed.error.issues });
  }

  const { stockCount, inStock, lowStockAlert } = parsed.data;

  // Derive inStock from stockCount when stockCount is explicitly provided
  let resolvedInStock = inStock;
  if (stockCount !== undefined) {
    if (stockCount === 0) {
      resolvedInStock = false;
    } else if (stockCount > 0) {
      resolvedInStock = true;
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(stockCount !== undefined ? { stockCount } : {}),
      ...(resolvedInStock !== undefined ? { inStock: resolvedInStock } : {}),
      ...(lowStockAlert !== undefined ? { lowStockAlert } : {}),
    },
  });

  return NextResponse.json(updated);
}
