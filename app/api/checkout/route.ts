import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { getOrCreateCart } from "@/lib/cart";
import {
  CheckoutInputSchema,
  apiError as createApiError,
} from "@/lib/validators";
import {
  computeOrderTotals,
  generateOrderNumberWithRetry,
  snapshotAddress,
} from "@/lib/orders";
import { selectPaymentProvider } from "@/lib/payments/select";
import { errorResponse } from "@/lib/api";

function getShippingFlatInPaise() {
  const parsed = Number.parseInt(process.env.SHIPPING_FLAT_PAISE ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

export async function POST(request: Request) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = CheckoutInputSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid checkout payload", 400);
  }

  const cart = await getOrCreateCart(session.user.id);
  if (cart.items.length === 0) {
    const err = createApiError("EMPTY_CART", "Cart is empty", 400);
    return NextResponse.json(err.body, { status: err.status });
  }

  const unavailableItems = cart.items
    .filter((item) => !item.product.inStock)
    .map((item) => ({
      itemId: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
    }));
  if (unavailableItems.length > 0) {
    return errorResponse("PRODUCT_UNAVAILABLE", "One or more products are unavailable", 409, {
      unavailableItems,
    });
  }

  const address = await prisma.address.findFirst({
    where: { id: parsed.data.addressId, userId: session.user.id },
  });
  if (!address) {
    return errorResponse("ADDRESS_NOT_FOUND", "Address not found", 404);
  }

  const shippingInPaise = getShippingFlatInPaise();
  const taxInPaise = 0;
  const currency = "INR";
  const provider = selectPaymentProvider();
  const totals = computeOrderTotals({
    items: cart.items.map((item) => ({
      quantity: item.quantity,
      unitPriceInPaise: item.product.priceInPaise,
    })),
    shippingInPaise,
    taxInPaise,
  });

  const orderNumber = await generateOrderNumberWithRetry(async (candidate) => {
    const existing = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    return Boolean(existing);
  }, 3);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotalInPaise: totals.subtotalInPaise,
        shippingInPaise,
        taxInPaise,
        totalInPaise: totals.totalInPaise,
        currency,
        shippingAddressJson: JSON.stringify(snapshotAddress(address)),
        notes: parsed.data.notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productNameSnapshot: item.product.name,
            productSlugSnapshot: item.product.slug,
            unitPriceInPaise: item.product.priceInPaise,
            quantity: item.quantity,
            lineTotalInPaise: item.product.priceInPaise * item.quantity,
          })),
        },
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalInPaise: order.totalInPaise,
      currency: order.currency,
    };
  });

  return NextResponse.json(
    {
      ...result,
      provider,
    },
    { status: 201 },
  );
}
