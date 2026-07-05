import { NextResponse } from "next/server";
import { CartItemUpdateSchema } from "@/lib/validators";
import { removeCartItem, updateCartItem, CartError } from "@/lib/cart";
import { requireCustomerSession } from "@/lib/rbac";
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
  const parsed = CartItemUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid cart payload", 400);
  }

  try {
    const cart = await updateCartItem({
      userId: session.user.id,
      itemId: id,
      quantity: parsed.data.quantity,
    });
    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof CartError) {
      return errorResponse(error.code, error.message, 404);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;
  try {
    const cart = await removeCartItem({
      userId: session.user.id,
      itemId: id,
    });
    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof CartError) {
      return errorResponse(error.code, error.message, 404);
    }
    throw error;
  }
}
