import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/orders/[id]/refund/route";
import { testDb } from "@/tests/helpers/db";
import { createOrder, createUser } from "@/tests/helpers/factories";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

function adminSession(role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE") {
  return {
    user: {
      id: "admin-user-id",
      username: "admin-user",
      name: "Admin User",
      email: "admin@example.com",
      userType: "admin" as const,
      role,
    },
  };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/orders/id/refund", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/orders/[id]/refund", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it("returns 401 without admin session", async () => {
    const user = await createUser();
    const { order } = await createOrder({ userId: user.id, withPayment: "COMPLETED" });
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST(
      makeRequest({
        type: "FULL",
        amountInPaise: order.totalInPaise,
        reason: "Refund",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    expect(response.status).toBe(401);
  });

  it.each(["MANAGER", "EMPLOYEE"] as const)("returns 403 for %s role", async (role) => {
    const user = await createUser();
    const { order } = await createOrder({ userId: user.id, withPayment: "COMPLETED" });
    getServerSessionMock.mockResolvedValue(adminSession(role));

    const response = await POST(
      makeRequest({
        type: "FULL",
        amountInPaise: order.totalInPaise,
        reason: "No permission",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    expect(response.status).toBe(403);
  });

  it.each(["SUPER_ADMIN", "ADMIN"] as const)("returns 200 for %s role", async (role) => {
    const user = await createUser();
    const { order } = await createOrder({ userId: user.id, withPayment: "COMPLETED" });
    getServerSessionMock.mockResolvedValue(adminSession(role));

    const response = await POST(
      makeRequest({
        type: "PARTIAL",
        amountInPaise: 1_000,
        reason: "Allowed role",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    expect(response.status).toBe(200);
  });

  it("FULL refund with wrong amount returns 422", async () => {
    const user = await createUser();
    const { order } = await createOrder({
      userId: user.id,
      totalInPaise: 10_000,
      withPayment: "COMPLETED",
    });
    getServerSessionMock.mockResolvedValue(adminSession("ADMIN"));

    const response = await POST(
      makeRequest({
        type: "FULL",
        amountInPaise: 9_999,
        reason: "Wrong amount",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("FULL_REFUND_AMOUNT_MISMATCH");
  });

  it("FULL refund with correct amount and cancelOrder cancels order and payment", async () => {
    const user = await createUser();
    const { order, payment } = await createOrder({
      userId: user.id,
      status: "CONFIRMED",
      totalInPaise: 10_000,
      withPayment: "COMPLETED",
    });
    getServerSessionMock.mockResolvedValue(adminSession("SUPER_ADMIN"));

    const response = await POST(
      makeRequest({
        type: "FULL",
        amountInPaise: 10_000,
        reason: "Customer request",
        cancelOrder: true,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    expect(response.status).toBe(200);

    const updatedOrder = await testDb.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.status).toBe("CANCELLED");
    expect(updatedOrder.paymentStatus).toBe("REFUNDED");

    const updatedPayment = await testDb.payment.findUniqueOrThrow({ where: { id: payment!.id } });
    expect(updatedPayment.status).toBe("REFUNDED");
  });

  it("two PARTIAL refunds to total mark payment refunded on second", async () => {
    const user = await createUser();
    const { order, payment } = await createOrder({
      userId: user.id,
      totalInPaise: 10_000,
      withPayment: "COMPLETED",
    });
    getServerSessionMock.mockResolvedValue(adminSession("ADMIN"));

    const first = await POST(
      makeRequest({
        type: "PARTIAL",
        amountInPaise: 4_000,
        reason: "First partial",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    const second = await POST(
      makeRequest({
        type: "PARTIAL",
        amountInPaise: 6_000,
        reason: "Second partial",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const updatedPayment = await testDb.payment.findUniqueOrThrow({ where: { id: payment!.id } });
    expect(updatedPayment.status).toBe("REFUNDED");
  });

  it("third PARTIAL exceeding remaining returns 422 with AMOUNT_EXCEEDS_REMAINING", async () => {
    const user = await createUser();
    const { order } = await createOrder({
      userId: user.id,
      totalInPaise: 10_000,
      withPayment: "COMPLETED",
    });
    getServerSessionMock.mockResolvedValue(adminSession("ADMIN"));

    await POST(
      makeRequest({
        type: "PARTIAL",
        amountInPaise: 4_000,
        reason: "First",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    await POST(
      makeRequest({
        type: "PARTIAL",
        amountInPaise: 5_000,
        reason: "Second",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    const third = await POST(
      makeRequest({
        type: "PARTIAL",
        amountInPaise: 2_000,
        reason: "Third exceeds",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );
    const payload = await third.json();

    expect(third.status).toBe(422);
    expect(payload.error.code).toBe("AMOUNT_EXCEEDS_REMAINING");
  });

  it("cancelOrder=true on DELIVERED order returns 409", async () => {
    const user = await createUser();
    const { order } = await createOrder({
      userId: user.id,
      status: "DELIVERED",
      totalInPaise: 7_000,
      withPayment: "COMPLETED",
    });
    getServerSessionMock.mockResolvedValue(adminSession("ADMIN"));

    const response = await POST(
      makeRequest({
        type: "FULL",
        amountInPaise: 7_000,
        reason: "Cannot cancel delivered",
        cancelOrder: true,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    expect(response.status).toBe(409);
  });

  it("rejects invalid zod payloads", async () => {
    const user = await createUser();
    const { order } = await createOrder({ userId: user.id, withPayment: "COMPLETED" });
    getServerSessionMock.mockResolvedValue(adminSession("ADMIN"));

    const negativeAmount = await POST(
      makeRequest({
        type: "PARTIAL",
        amountInPaise: -1,
        reason: "Bad amount",
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    const missingReason = await POST(
      makeRequest({
        type: "PARTIAL",
        amountInPaise: 100,
        cancelOrder: false,
      }),
      { params: Promise.resolve({ id: order.id }) },
    );

    expect([400, 422]).toContain(negativeAmount.status);
    expect([400, 422]).toContain(missingReason.status);
  });
});
