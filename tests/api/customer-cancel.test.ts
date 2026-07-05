import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/orders/[orderNumber]/cancel/route";
import { createOrder, createUser } from "@/tests/helpers/factories";

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

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/orders/order/cancel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/orders/[orderNumber]/cancel", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it("returns 401 without session", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST(makeRequest({ reason: "Cancel" }), {
      params: Promise.resolve({ orderNumber: "missing" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 when order belongs to different user", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const { order } = await createOrder({ userId: owner.id, status: "PENDING" });
    getServerSessionMock.mockResolvedValue(customerSession({ id: stranger.id, email: stranger.email }));

    const response = await POST(makeRequest({ reason: "Not mine" }), {
      params: Promise.resolve({ orderNumber: order.orderNumber }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 404 when order does not exist", async () => {
    const user = await createUser();
    getServerSessionMock.mockResolvedValue(customerSession({ id: user.id, email: user.email }));

    const response = await POST(makeRequest({ reason: "Cancel" }), {
      params: Promise.resolve({ orderNumber: "DMS-404-ORDER" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 409 on PROCESSING status", async () => {
    const user = await createUser();
    const { order } = await createOrder({ userId: user.id, status: "PROCESSING" });
    getServerSessionMock.mockResolvedValue(customerSession({ id: user.id, email: user.email }));

    const response = await POST(makeRequest({ reason: "Too late" }), {
      params: Promise.resolve({ orderNumber: order.orderNumber }),
    });
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("INVALID_STATUS_FOR_CUSTOMER_CANCEL");
  });

  it("returns 200 for PENDING order", async () => {
    const user = await createUser();
    const { order } = await createOrder({ userId: user.id, status: "PENDING" });
    getServerSessionMock.mockResolvedValue(customerSession({ id: user.id, email: user.email }));

    const response = await POST(makeRequest({ reason: "Changed mind" }), {
      params: Promise.resolve({ orderNumber: order.orderNumber }),
    });

    expect(response.status).toBe(200);
  });

  it("returns 200 for CONFIRMED order", async () => {
    const user = await createUser();
    const { order } = await createOrder({ userId: user.id, status: "CONFIRMED" });
    getServerSessionMock.mockResolvedValue(customerSession({ id: user.id, email: user.email }));

    const response = await POST(makeRequest({ reason: "Need to reorder" }), {
      params: Promise.resolve({ orderNumber: order.orderNumber }),
    });

    expect(response.status).toBe(200);
  });

  it("rejects empty reason with validation status", async () => {
    const user = await createUser();
    const { order } = await createOrder({ userId: user.id, status: "PENDING" });
    getServerSessionMock.mockResolvedValue(customerSession({ id: user.id, email: user.email }));

    const response = await POST(makeRequest({ reason: " " }), {
      params: Promise.resolve({ orderNumber: order.orderNumber }),
    });

    expect([400, 422]).toContain(response.status);
  });
});
