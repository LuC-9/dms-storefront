import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/rbac";
import { getOrCreateCart } from "@/lib/cart";
import { computeOrderTotals } from "@/lib/orders";
import { errorResponse } from "@/lib/api";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const cart = await getOrCreateCart(session.user.id);
  const { subtotalInPaise } = computeOrderTotals({
    items: cart.items.map((item) => ({
      quantity: item.quantity,
      unitPriceInPaise: item.product.priceInPaise,
    })),
    shippingInPaise: 0,
    taxInPaise: 0,
  });

  return NextResponse.json({
    id: cart.id,
    userId: cart.userId,
    updatedAt: cart.updatedAt,
    subtotalInPaise,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        imageUrl: item.product.imageUrl,
        priceInPaise: item.product.priceInPaise,
        inStock: item.product.inStock,
      },
    })),
  });
}
