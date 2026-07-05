import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/provider";
import { selectPaymentProvider } from "@/lib/payments/select";
import { prisma } from "@/lib/prisma";
import { applyTransitionTimestamps, assertTransition } from "@/lib/state-machine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const providerName = selectPaymentProvider();
  const provider = getPaymentProvider(providerName);
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  let event:
    | {
        providerOrderId?: string;
        providerPaymentId?: string;
        status: "COMPLETED" | "FAILED" | "REFUNDED";
      }
    | null = null;

  try {
    event = await provider.handleWebhookEvent({ rawBody, signature });
  } catch (error) {
    console.warn("Webhook rejected: missing/invalid signature", {
      provider: provider.name,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!event.providerOrderId && !event.providerPaymentId) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        ...(event.providerOrderId ? [{ providerOrderId: event.providerOrderId }] : []),
        ...(event.providerPaymentId ? [{ providerPaymentId: event.providerPaymentId }] : []),
      ],
    },
  });

  if (!payment) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await prisma.$transaction(async (tx) => {
    if (payment.status !== event.status) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: event.status,
          providerOrderId: event.providerOrderId ?? payment.providerOrderId,
          providerPaymentId: event.providerPaymentId ?? payment.providerPaymentId,
          errorMessage: event.status === "FAILED" ? "Payment failed via webhook" : null,
        },
      });
    }

    if (event.status === "COMPLETED") {
      const latestOrder = await tx.order.findUnique({
        where: { id: payment.orderId },
        select: { status: true, paymentStatus: true },
      });

      if (latestOrder?.status === "PENDING") {
        assertTransition(latestOrder.status, "CONFIRMED", "ADMIN");
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "COMPLETED",
            ...applyTransitionTimestamps({ status: latestOrder.status }, "CONFIRMED"),
          },
        });
      } else if (latestOrder && latestOrder.paymentStatus !== "COMPLETED") {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "COMPLETED",
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
