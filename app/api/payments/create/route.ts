import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { getPaymentProvider } from "@/lib/payments/provider";
import { selectPaymentProvider } from "@/lib/payments/select";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";

export const runtime = "nodejs";

const CreatePaymentSchema = z.object({
  orderNumber: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreatePaymentSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid create payment payload", 400);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
  });

  if (!order || order.userId !== session.user.id) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  if (order.paymentStatus !== "PENDING") {
    return errorResponse("ORDER_PAYMENT_NOT_PENDING", "Payment is already finalized", 409);
  }

  const providerName = selectPaymentProvider();
  const provider = getPaymentProvider(providerName);

  const customer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!customer) {
    return errorResponse("NOT_FOUND", "Customer not found", 404);
  }

  const created = await provider.createPaymentOrder({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      totalInPaise: order.totalInPaise,
      currency: order.currency,
    },
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: created.providerName,
      providerOrderId: created.providerOrderId,
      amountInPaise: created.amountInPaise,
      currency: created.currency,
      status: "PENDING",
      errorMessage: null,
    },
  });

  return NextResponse.json({
    provider: created.providerName,
    providerOrderId: created.providerOrderId,
    paymentId: payment.id,
    amountInPaise: created.amountInPaise,
    currency: created.currency,
    clientKey: created.clientKey,
    clientOptions: created.clientOptions,
  });
}
