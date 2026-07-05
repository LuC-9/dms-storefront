import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { StockNotificationSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/api";

export async function POST(request: Request) {
  const session = await requireCustomerSession();
  const payload = await request.json().catch(() => null);
  const parsed = StockNotificationSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid notification request", 400);
  }

  const fallbackEmail = session?.user?.email?.toLowerCase().trim();
  const requestedEmail = parsed.data.email?.toLowerCase().trim();
  const email = requestedEmail || fallbackEmail;
  if (!email) {
    return errorResponse("EMAIL_REQUIRED", "Please enter a valid email", 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, inStock: true },
  });
  if (!product) {
    return errorResponse("PRODUCT_NOT_FOUND", "Product not found", 404);
  }
  if (product.inStock) {
    return errorResponse("ALREADY_IN_STOCK", "This product is already in stock", 409);
  }

  try {
    await prisma.stockNotification.create({
      data: {
        email,
        productId: product.id,
      },
    });
    return NextResponse.json({
      success: true,
      message: "We'll email you when this is back in stock",
    });
  } catch (error) {
    const duplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002";

    if (duplicate) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "You're already on the list",
      });
    }

    throw error;
  }
}
