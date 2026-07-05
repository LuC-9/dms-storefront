import { NextResponse } from "next/server";
import { addItemToCart, CartError } from "@/lib/cart";
import { requireCustomerSession } from "@/lib/rbac";
import { CartItemInputSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/api";

export async function POST(request: Request) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = CartItemInputSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid cart payload", 400);
  }

  try {
    const cart = await addItemToCart({
      userId: session.user.id,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
    });
    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof CartError) {
      if (error.code === "PRODUCT_NOT_FOUND") {
        return errorResponse(error.code, error.message, 404);
      }
      if (error.code === "PRODUCT_UNAVAILABLE") {
        return errorResponse(error.code, error.message, 409);
      }
      return errorResponse(error.code, error.message, 400);
    }
    throw error;
  }
}
