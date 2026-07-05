import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { getPaymentProvider } from "@/lib/payments/provider";
import { selectPaymentProvider } from "@/lib/payments/select";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { applyTransitionTimestamps, assertTransition } from "@/lib/state-machine";

export const runtime = "nodejs";

const VerifyPaymentSchema = z.object({
  orderNumber: z.string().trim().min(1),
  providerOrderId: z.string().trim().min(1),
  providerPaymentId: z.string().trim().min(1),
  providerSignature: z.string().trim().min(1),
  methodDetails: z
    .object({
      cardLast4: z.string().trim().min(4).max(4),
      cardType: z.string().trim().min(2).max(24),
    })
    .optional(),
  failureReason: z.string().trim().min(1).optional(),
  status: z.enum(["COMPLETED", "FAILED"]).optional(),
});

export async function POST(request: Request) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = VerifyPaymentSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid payment verification payload", 400);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
  });

  if (!order || order.userId !== session.user.id) {
    return errorResponse("NOT_FOUND", "Order not found", 404);
  }

  const payment = await prisma.payment.findFirst({
    where: {
      orderId: order.id,
      providerOrderId: parsed.data.providerOrderId,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) {
    return errorResponse("PAYMENT_NOT_FOUND", "Payment record not found", 404);
  }

  if (payment.status === "COMPLETED") {
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, idempotent: true });
  }

  const providerName = selectPaymentProvider(payment.provider);
  const provider = getPaymentProvider(providerName);

  const verification = await provider.verifyPayment({
    providerOrderId: parsed.data.providerOrderId,
    providerPaymentId: parsed.data.providerPaymentId,
    providerSignature: parsed.data.providerSignature,
    metadata: {
      status: parsed.data.status,
      errorMessage: parsed.data.failureReason ?? null,
      cardLast4: parsed.data.methodDetails?.cardLast4,
      cardType: parsed.data.methodDetails?.cardType,
    },
  });

  if (!verification.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: parsed.data.providerPaymentId,
        providerSignature: parsed.data.providerSignature,
        status: "FAILED",
        errorMessage: verification.reason ?? "Payment verification failed",
        methodDetailsJson: JSON.stringify(verification.methodDetails ?? parsed.data.methodDetails ?? {}),
      },
    });

    return errorResponse(
      "PAYMENT_VERIFICATION_FAILED",
      verification.reason ?? "Payment verification failed",
      400,
    );
  }

  await prisma.$transaction(async (tx) => {
    const latest = await tx.payment.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });
    if (latest?.status !== "COMPLETED") {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          providerOrderId: parsed.data.providerOrderId,
          providerPaymentId: parsed.data.providerPaymentId,
          providerSignature: parsed.data.providerSignature,
          methodDetailsJson: JSON.stringify(verification.methodDetails ?? parsed.data.methodDetails ?? {}),
          errorMessage: null,
        },
      });
    }

    const currentOrder = await tx.order.findUnique({
      where: { id: order.id },
      select: { status: true, paymentStatus: true },
    });
    if (!currentOrder) {
      return;
    }

    const orderUpdate: {
      paymentStatus?: "COMPLETED";
      status?: "CONFIRMED";
      confirmedAt?: Date;
    } = {};

    if (currentOrder.paymentStatus !== "COMPLETED") {
      orderUpdate.paymentStatus = "COMPLETED";
    }
    if (currentOrder.status === "PENDING") {
      assertTransition(currentOrder.status, "CONFIRMED", "ADMIN");
      orderUpdate.status = "CONFIRMED";
      orderUpdate.confirmedAt =
        applyTransitionTimestamps({ status: currentOrder.status }, "CONFIRMED").confirmedAt ?? new Date();
    }

    if (Object.keys(orderUpdate).length > 0) {
      await tx.order.update({
        where: { id: order.id },
        data: orderUpdate,
      });
    }

    const customerCart = await tx.cart.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (customerCart) {
      await tx.cartItem.deleteMany({
        where: { cartId: customerCart.id },
      });
    }
  });

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}
