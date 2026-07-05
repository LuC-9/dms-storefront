import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getCustomerRefunds } from "@/app/api/orders/[orderNumber]/refunds/route";
import { GET as getAdminRefunds } from "@/app/api/admin/orders/[id]/refunds/route";
import { createOrder, createRefund, createUser } from "@/tests/helpers/factories";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

function customerSession(user: { id: string; email: string }) {
  return {
    user: {
      id: user.id,
      email: user.email,
      userType: "customer" as const,
      role: "customer" as const,
    },
  };
}

function adminSession(role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE") {
  return {
    user: {
      id: "admin-id",
      email: "admin@example.com",
      username: "admin",
      userType: "admin" as const,
      role,
    },
  };
}

describe("refund history endpoints", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it("customer GET refunds: owner sees data, stranger 403, guest 401", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const { order } = await createOrder({
      userId: owner.id,
      totalInPaise: 10_000,
      withPayment: "COMPLETED",
    });
    await createRefund({ orderId: order.id, amountInPaise: 3_000, status: "PENDING", type: "PARTIAL" });

    getServerSessionMock.mockResolvedValue(customerSession({ id: owner.id, email: owner.email }));
    const ownerResponse = await getCustomerRefunds(new Request("http://localhost"), {
      params: Promise.resolve({ orderNumber: order.orderNumber }),
    });
    const ownerPayload = await ownerResponse.json();
    expect(ownerResponse.status).toBe(200);
    expect(ownerPayload.totalRefundedInPaise).toBe(3_000);
    expect(ownerPayload.remainingRefundableInPaise).toBe(7_000);

    getServerSessionMock.mockResolvedValue(customerSession({ id: stranger.id, email: stranger.email }));
    const strangerResponse = await getCustomerRefunds(new Request("http://localhost"), {
      params: Promise.resolve({ orderNumber: order.orderNumber }),
    });
    expect(strangerResponse.status).toBe(403);

    getServerSessionMock.mockResolvedValue(null);
    const guestResponse = await getCustomerRefunds(new Request("http://localhost"), {
      params: Promise.resolve({ orderNumber: order.orderNumber }),
    });
    expect(guestResponse.status).toBe(401);
  });

  it.each(["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"] as const)(
    "admin GET refunds allows %s",
    async (role) => {
      const owner = await createUser();
      const { order } = await createOrder({
        userId: owner.id,
        totalInPaise: 15_000,
        withPayment: "COMPLETED",
      });
      await createRefund({ orderId: order.id, amountInPaise: 5_000, status: "PENDING", type: "PARTIAL" });
      await createRefund({ orderId: order.id, amountInPaise: 2_000, status: "FAILED", type: "PARTIAL" });

      getServerSessionMock.mockResolvedValue(adminSession(role));
      const response = await getAdminRefunds(new Request("http://localhost"), {
        params: Promise.resolve({ id: order.id }),
      });
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.refunds).toHaveLength(2);
      expect(payload.totalRefundedInPaise).toBe(5_000);
      expect(payload.remainingRefundableInPaise).toBe(10_000);
    },
  );
});
