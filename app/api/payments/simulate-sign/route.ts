import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import {
  createSimulatorVerificationSignature,
  getSimulatorCardOutcome,
} from "@/lib/payments/simulator";
import { selectPaymentProvider } from "@/lib/payments/select";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";

export const runtime = "nodejs";

const SimulatorSignSchema = z.object({
  providerOrderId: z.string().trim().min(1),
  providerPaymentId: z.string().trim().regex(/^SIM-\d{10,}-[A-Z0-9]{4,}$/),
  cardNumber: z.string().trim().min(12).max(30),
  expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  cvv: z.string().trim().regex(/^\d{3,4}$/),
});

export async function POST(request: Request) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  if (selectPaymentProvider() !== "simulator") {
    return errorResponse("NOT_FOUND", "Not found", 404);
  }

  const payload = await request.json().catch(() => null);
  const parsed = SimulatorSignSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid simulator sign payload", 400);
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: "simulator",
      providerOrderId: parsed.data.providerOrderId,
      status: "PENDING",
      order: {
        userId: session.user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (!payment) {
    return errorResponse("NOT_FOUND", "Payment not found", 404);
  }

  const outcome = getSimulatorCardOutcome(parsed.data.cardNumber);

  return NextResponse.json({
    providerSignature: createSimulatorVerificationSignature({
      providerOrderId: parsed.data.providerOrderId,
      providerPaymentId: parsed.data.providerPaymentId,
      status: outcome.status,
      errorMessage: outcome.errorMessage,
      cardLast4: outcome.methodDetails.cardLast4,
      cardType: outcome.methodDetails.cardType,
    }),
    status: outcome.status,
    errorMessage: outcome.errorMessage,
    methodDetails: outcome.methodDetails,
  });
}
