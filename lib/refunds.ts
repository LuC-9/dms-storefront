import type { Refund } from "@prisma/client";
import { RefundStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NonFailedRefundSummary = { totalRefundedInPaise: number };

type OrderWithRefunds = {
  totalInPaise: number;
  refunds: Array<{ amountInPaise: number; status: RefundStatus }>;
};

export class RefundValidationError extends Error {
  code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "RefundValidationError";
    this.code = code;
  }
}

export function getRefundedTotalInPaise(order: {
  refunds: { amountInPaise: number; status: RefundStatus }[];
}): number {
  return order.refunds.reduce((total, refund) => {
    if (refund.status === "FAILED") {
      return total;
    }
    return total + refund.amountInPaise;
  }, 0);
}

export function getRefundableRemainingInPaise(order: OrderWithRefunds): number {
  const refundedTotal = getRefundedTotalInPaise(order);
  return Math.max(0, order.totalInPaise - refundedTotal);
}

export function assertRefundAmountValid(order: OrderWithRefunds, requestedInPaise: number): void {
  if (!Number.isInteger(requestedInPaise) || requestedInPaise <= 0) {
    throw new RefundValidationError("AMOUNT_NON_POSITIVE", "Refund amount must be a positive integer in paise");
  }

  if (requestedInPaise > order.totalInPaise) {
    throw new RefundValidationError("AMOUNT_EXCEEDS_TOTAL", "Refund amount exceeds order total");
  }

  const remaining = getRefundableRemainingInPaise(order);
  if (requestedInPaise > remaining) {
    throw new RefundValidationError("AMOUNT_EXCEEDS_REMAINING", "Refund amount exceeds remaining refundable amount");
  }
}

export async function createRefundTx(input: {
  orderId: string;
  type: "FULL" | "PARTIAL";
  amountInPaise: number;
  reason: string;
  initiatedBy: string;
  cancelOrder: boolean;
  cancellationReason?: string;
}): Promise<{ refund: Refund; orderCancelled: boolean; paymentMarkedRefunded: boolean }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        status: true,
        totalInPaise: true,
        refunds: {
          select: {
            amountInPaise: true,
            status: true,
          },
        },
        payments: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      throw new RefundValidationError("ORDER_NOT_FOUND", "Order not found");
    }

    assertRefundAmountValid(order, input.amountInPaise);

    const latestCompletedPayment = order.payments[0] ?? null;

    const refund = await tx.refund.create({
      data: {
        orderId: order.id,
        paymentId: latestCompletedPayment?.id ?? null,
        amountInPaise: input.amountInPaise,
        type: input.type,
        reason: input.reason,
        initiatedBy: input.initiatedBy,
        status: "PENDING",
      },
    });

    let orderCancelled = false;
    if (input.cancelOrder) {
      if (order.status === "DELIVERED") {
        throw new RefundValidationError("ORDER_ALREADY_DELIVERED", "Delivered orders cannot be cancelled");
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.cancellationReason ?? input.reason,
          cancelledBy: input.initiatedBy,
        },
      });
      orderCancelled = true;
    }

    const updatedRefundedTotal = getRefundedTotalInPaise({
      refunds: [...order.refunds, { amountInPaise: refund.amountInPaise, status: refund.status }],
    });

    let paymentMarkedRefunded = false;
    if (updatedRefundedTotal === order.totalInPaise && latestCompletedPayment) {
      await tx.payment.update({
        where: { id: latestCompletedPayment.id },
        data: { status: "REFUNDED" },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "REFUNDED" },
      });
      paymentMarkedRefunded = true;
    }

    return { refund, orderCancelled, paymentMarkedRefunded };
  });
}

export async function cancelOrderAsCustomer(input: {
  orderId: string;
  userId: string;
  reason: string;
  customerEmail: string;
}): Promise<{ refundCreated: boolean }> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      totalInPaise: true,
      refunds: {
        select: {
          amountInPaise: true,
          status: true,
        },
      },
      payments: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!order || order.userId !== input.userId) {
    throw new RefundValidationError("ORDER_NOT_FOUND", "Order not found");
  }

  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new RefundValidationError(
      "INVALID_STATUS_FOR_CUSTOMER_CANCEL",
      "Only pending or confirmed orders can be cancelled by customer",
    );
  }

  const hasCompletedPayment = Boolean(order.payments[0]);
  if (hasCompletedPayment) {
    const remaining = getRefundableRemainingInPaise(order);
    if (remaining <= 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.reason,
          cancelledBy: input.customerEmail,
        },
      });
      return { refundCreated: false };
    }

    await createRefundTx({
      orderId: order.id,
      type: "FULL",
      amountInPaise: remaining,
      reason: input.reason,
      initiatedBy: input.customerEmail,
      cancelOrder: true,
      cancellationReason: input.reason,
    });
    return { refundCreated: true };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: input.reason,
      cancelledBy: input.customerEmail,
    },
  });

  return { refundCreated: false };
}
