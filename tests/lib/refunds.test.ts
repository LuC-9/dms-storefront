import { describe, expect, it } from "vitest";
import {
  assertRefundAmountValid,
  cancelOrderAsCustomer,
  createRefundTx,
  getRefundableRemainingInPaise,
  getRefundedTotalInPaise,
  RefundValidationError,
} from "@/lib/refunds";
import { testDb } from "@/tests/helpers/db";
import { createOrder, createUser } from "@/tests/helpers/factories";

describe("lib/refunds", () => {
  it("getRefundedTotalInPaise excludes FAILED refunds", () => {
    const total = getRefundedTotalInPaise({
      refunds: [
        { amountInPaise: 1_000, status: "PENDING" },
        { amountInPaise: 2_000, status: "FAILED" },
        { amountInPaise: 500, status: "PROCESSED" },
      ],
    });

    expect(total).toBe(1_500);
  });

  it("getRefundableRemainingInPaise subtracts non-failed and floors at zero", () => {
    const remaining = getRefundableRemainingInPaise({
      totalInPaise: 3_000,
      refunds: [
        { amountInPaise: 2_000, status: "PENDING" },
        { amountInPaise: 1_500, status: "PROCESSED" },
      ],
    });

    expect(remaining).toBe(0);
  });

  it("assertRefundAmountValid throws AMOUNT_NON_POSITIVE", () => {
    expect(() =>
      assertRefundAmountValid({ totalInPaise: 1_000, refunds: [] }, 0),
    ).toThrowError(
      expect.objectContaining<Partial<RefundValidationError>>({
        code: "AMOUNT_NON_POSITIVE",
      }),
    );
  });

  it("assertRefundAmountValid throws AMOUNT_EXCEEDS_TOTAL", () => {
    expect(() =>
      assertRefundAmountValid({ totalInPaise: 1_000, refunds: [] }, 1_001),
    ).toThrowError(
      expect.objectContaining<Partial<RefundValidationError>>({
        code: "AMOUNT_EXCEEDS_TOTAL",
      }),
    );
  });

  it("assertRefundAmountValid throws AMOUNT_EXCEEDS_REMAINING", () => {
    expect(() =>
      assertRefundAmountValid(
        {
          totalInPaise: 10_000,
          refunds: [{ amountInPaise: 9_500, status: "PENDING" }],
        },
        600,
      ),
    ).toThrowError(
      expect.objectContaining<Partial<RefundValidationError>>({
        code: "AMOUNT_EXCEEDS_REMAINING",
      }),
    );
  });

  it("createRefundTx FULL creates refund, cancels order, and marks payment refunded", async () => {
    const user = await createUser();
    const { order, payment } = await createOrder({
      userId: user.id,
      status: "CONFIRMED",
      totalInPaise: 12_000,
      withPayment: "COMPLETED",
    });

    const result = await createRefundTx({
      orderId: order.id,
      type: "FULL",
      amountInPaise: 12_000,
      reason: "Customer requested cancellation",
      initiatedBy: "customer@example.com",
      cancelOrder: true,
      cancellationReason: "Changed plans",
    });

    expect(result.orderCancelled).toBe(true);
    expect(result.paymentMarkedRefunded).toBe(true);

    const savedRefund = await testDb.refund.findUnique({ where: { id: result.refund.id } });
    expect(savedRefund).toBeTruthy();
    expect(savedRefund?.paymentId).toBe(payment?.id ?? null);

    const savedOrder = await testDb.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(savedOrder.status).toBe("CANCELLED");
    expect(savedOrder.cancellationReason).toBe("Changed plans");
    expect(savedOrder.cancelledBy).toBe("customer@example.com");
    expect(savedOrder.cancelledAt).toBeTruthy();
    expect(savedOrder.paymentStatus).toBe("REFUNDED");

    const savedPayment = await testDb.payment.findUniqueOrThrow({ where: { id: payment!.id } });
    expect(savedPayment.status).toBe("REFUNDED");
  });

  it("createRefundTx PARTIAL keeps payment completed and rejects over-refund", async () => {
    const user = await createUser();
    const { order, payment } = await createOrder({
      userId: user.id,
      totalInPaise: 10_000,
      withPayment: "COMPLETED",
    });

    const first = await createRefundTx({
      orderId: order.id,
      type: "PARTIAL",
      amountInPaise: 4_000,
      reason: "Partial goodwill",
      initiatedBy: "admin",
      cancelOrder: false,
    });

    expect(first.paymentMarkedRefunded).toBe(false);

    const paymentAfterFirst = await testDb.payment.findUniqueOrThrow({ where: { id: payment!.id } });
    expect(paymentAfterFirst.status).toBe("COMPLETED");

    await expect(
      createRefundTx({
        orderId: order.id,
        type: "PARTIAL",
        amountInPaise: 6_001,
        reason: "Too much",
        initiatedBy: "admin",
        cancelOrder: false,
      }),
    ).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_REMAINING" });
  });

  it("createRefundTx refuses cancel on delivered order", async () => {
    const user = await createUser();
    const { order } = await createOrder({
      userId: user.id,
      status: "DELIVERED",
      totalInPaise: 8_000,
      withPayment: "COMPLETED",
    });

    await expect(
      createRefundTx({
        orderId: order.id,
        type: "FULL",
        amountInPaise: 8_000,
        reason: "Cannot cancel delivered",
        initiatedBy: "admin",
        cancelOrder: true,
      }),
    ).rejects.toMatchObject({ code: "ORDER_ALREADY_DELIVERED" });

    const refundCount = await testDb.refund.count({ where: { orderId: order.id } });
    expect(refundCount).toBe(0);
  });

  it("cancelOrderAsCustomer rejects non-pending/confirmed statuses", async () => {
    const user = await createUser();
    const { order } = await createOrder({
      userId: user.id,
      status: "PROCESSING",
      withPayment: "COMPLETED",
    });

    await expect(
      cancelOrderAsCustomer({
        orderId: order.id,
        userId: user.id,
        reason: "Too late",
        customerEmail: user.email,
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATUS_FOR_CUSTOMER_CANCEL" });
  });

  it("cancelOrderAsCustomer on paid order creates refund and marks payment refunded", async () => {
    const user = await createUser();
    const { order, payment } = await createOrder({
      userId: user.id,
      status: "PENDING",
      totalInPaise: 9_000,
      withPayment: "COMPLETED",
    });

    const result = await cancelOrderAsCustomer({
      orderId: order.id,
      userId: user.id,
      reason: "Need to cancel",
      customerEmail: user.email,
    });

    expect(result.refundCreated).toBe(true);

    const refunds = await testDb.refund.findMany({ where: { orderId: order.id } });
    expect(refunds).toHaveLength(1);
    expect(refunds[0]?.amountInPaise).toBe(9_000);

    const updatedOrder = await testDb.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.status).toBe("CANCELLED");
    expect(updatedOrder.cancellationReason).toBe("Need to cancel");
    expect(updatedOrder.cancelledBy).toBe(user.email);
    expect(updatedOrder.paymentStatus).toBe("REFUNDED");

    const updatedPayment = await testDb.payment.findUniqueOrThrow({ where: { id: payment!.id } });
    expect(updatedPayment.status).toBe("REFUNDED");
  });

  it("cancelOrderAsCustomer on unpaid order cancels without creating refund", async () => {
    const user = await createUser();
    const { order } = await createOrder({
      userId: user.id,
      status: "CONFIRMED",
      withPayment: null,
    });

    const result = await cancelOrderAsCustomer({
      orderId: order.id,
      userId: user.id,
      reason: "Address mistake",
      customerEmail: user.email,
    });

    expect(result.refundCreated).toBe(false);

    const refundCount = await testDb.refund.count({ where: { orderId: order.id } });
    expect(refundCount).toBe(0);

    const updatedOrder = await testDb.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.status).toBe("CANCELLED");
    expect(updatedOrder.cancellationReason).toBe("Address mistake");
  });
});
