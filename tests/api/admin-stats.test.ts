import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/admin/stats/route";
import { createOrder, createRefund, createUser } from "@/tests/helpers/factories";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

function adminSession() {
  return {
    user: {
      id: "admin-id",
      email: "admin@example.com",
      username: "admin",
      userType: "admin" as const,
      role: "ADMIN" as const,
    },
  };
}

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it("refundsThisMonth counts only current-month non-failed refunds", async () => {
    const user = await createUser();
    const { order } = await createOrder({
      userId: user.id,
      totalInPaise: 20_000,
      withPayment: "COMPLETED",
    });

    const now = new Date();
    const oldDate = new Date(now);
    oldDate.setDate(oldDate.getDate() - 60);

    await createRefund({
      orderId: order.id,
      amountInPaise: 2_500,
      status: "PENDING",
      type: "PARTIAL",
      createdAt: now,
    });
    await createRefund({
      orderId: order.id,
      amountInPaise: 4_000,
      status: "PENDING",
      type: "PARTIAL",
      createdAt: oldDate,
    });
    await createRefund({
      orderId: order.id,
      amountInPaise: 1_000,
      status: "FAILED",
      type: "PARTIAL",
      createdAt: now,
    });

    getServerSessionMock.mockResolvedValue(adminSession());
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.refundsThisMonth.count).toBe(1);
    expect(payload.refundsThisMonth.totalInPaise).toBe(2_500);
  });
});
