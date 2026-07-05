import { beforeEach, describe, expect, it, vi } from "vitest";

type TestOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  totalInPaise: number;
  currency: string;
  status: "PENDING" | "CONFIRMED";
  paymentStatus: "PENDING" | "COMPLETED";
  confirmedAt: Date | null;
};

type TestPayment = {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  providerSignature: string | null;
  amountInPaise: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  methodDetailsJson: string | null;
  errorMessage: string | null;
  createdAt: Date;
};

const mocks = vi.hoisted(() => {
  const state = {
    users: new Map<string, { id: string; name: string; email: string; phone: string | null }>(),
    orders: new Map<string, TestOrder>(),
    payments: new Map<string, TestPayment>(),
    cartByUserId: new Map<string, { id: string; userId: string }>(),
    paymentSeq: 1,
    providerOrderSeq: 1,
  };

  const requireCustomerSessionMock = vi.fn();
  const selectPaymentProviderMock = vi.fn();
  const getPaymentProviderMock = vi.fn();

  const provider = {
    createPaymentOrder: vi.fn(),
    verifyPayment: vi.fn(),
    handleWebhookEvent: vi.fn(),
  };

  function findOrderByOrderNumber(orderNumber: string) {
    for (const order of state.orders.values()) {
      if (order.orderNumber === orderNumber) {
        return order;
      }
    }
    return null;
  }

  const prisma = {
    order: {
      findUnique: vi.fn(async ({ where, select }: any) => {
        const order =
          where?.id ? state.orders.get(where.id) ?? null : findOrderByOrderNumber(where?.orderNumber ?? "");
        if (!order) {
          return null;
        }
        if (!select) {
          return { ...order };
        }
        const selected: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          if (select[key]) {
            selected[key] = (order as Record<string, unknown>)[key];
          }
        }
        return selected;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const order = state.orders.get(where.id);
        if (!order) {
          throw new Error("Order not found");
        }
        const next = { ...order, ...data };
        state.orders.set(order.id, next);
        return { ...next };
      }),
    },
    user: {
      findUnique: vi.fn(async ({ where, select }: any) => {
        const user = state.users.get(where.id) ?? null;
        if (!user) {
          return null;
        }
        if (!select) {
          return { ...user };
        }
        const selected: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          if (select[key]) {
            selected[key] = (user as Record<string, unknown>)[key];
          }
        }
        return selected;
      }),
    },
    payment: {
      create: vi.fn(async ({ data }: any) => {
        const payment: TestPayment = {
          id: `pay_${state.paymentSeq++}`,
          orderId: data.orderId,
          provider: data.provider,
          providerOrderId: data.providerOrderId ?? null,
          providerPaymentId: data.providerPaymentId ?? null,
          providerSignature: data.providerSignature ?? null,
          amountInPaise: data.amountInPaise,
          currency: data.currency,
          status: data.status,
          methodDetailsJson: data.methodDetailsJson ?? null,
          errorMessage: data.errorMessage ?? null,
          createdAt: new Date(),
        };
        state.payments.set(payment.id, payment);
        return { ...payment };
      }),
      findFirst: vi.fn(async ({ where, orderBy }: any) => {
        let rows = Array.from(state.payments.values()).filter((payment) => {
          if (where?.orderId && payment.orderId !== where.orderId) {
            return false;
          }
          if (where?.providerOrderId && payment.providerOrderId !== where.providerOrderId) {
            return false;
          }
          if (where?.provider && payment.provider !== where.provider) {
            return false;
          }
          if (where?.status && payment.status !== where.status) {
            return false;
          }
          return true;
        });

        if (orderBy?.createdAt === "desc") {
          rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return rows[0] ? { ...rows[0] } : null;
      }),
      findUnique: vi.fn(async ({ where, select }: any) => {
        const payment = state.payments.get(where.id) ?? null;
        if (!payment) {
          return null;
        }
        if (!select) {
          return { ...payment };
        }
        const selected: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          if (select[key]) {
            selected[key] = (payment as Record<string, unknown>)[key];
          }
        }
        return selected;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const payment = state.payments.get(where.id);
        if (!payment) {
          throw new Error("Payment not found");
        }
        const next = { ...payment, ...data };
        state.payments.set(payment.id, next);
        return { ...next };
      }),
    },
    cart: {
      findUnique: vi.fn(async ({ where, select }: any) => {
        const cart = state.cartByUserId.get(where.userId) ?? null;
        if (!cart) {
          return null;
        }
        if (!select) {
          return { ...cart };
        }
        const selected: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          if (select[key]) {
            selected[key] = (cart as Record<string, unknown>)[key];
          }
        }
        return selected;
      }),
    },
    cartItem: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    $transaction: vi.fn(async (callback: any) => callback(prisma)),
  };

  return {
    state,
    provider,
    prisma,
    requireCustomerSessionMock,
    selectPaymentProviderMock,
    getPaymentProviderMock,
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/rbac", () => ({ requireCustomerSession: mocks.requireCustomerSessionMock }));
vi.mock("@/lib/payments/select", () => ({ selectPaymentProvider: mocks.selectPaymentProviderMock }));
vi.mock("@/lib/payments/provider", () => ({ getPaymentProvider: mocks.getPaymentProviderMock }));

import { POST as createPaymentPost } from "@/app/api/payments/create/route";
import { POST as verifyPaymentPost } from "@/app/api/payments/verify/route";

function makeJsonRequest(url: string, body: Record<string, unknown>) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seedOrder(input: { id: string; orderNumber: string; userId: string }) {
  mocks.state.orders.set(input.id, {
    id: input.id,
    orderNumber: input.orderNumber,
    userId: input.userId,
    totalInPaise: 5099,
    currency: "INR",
    status: "PENDING",
    paymentStatus: "PENDING",
    confirmedAt: null,
  });
}

function seedUser(input: { id: string }) {
  mocks.state.users.set(input.id, {
    id: input.id,
    name: "Delta Customer",
    email: "customer@example.com",
    phone: "9999999999",
  });
}

function getOrder(orderId: string) {
  const order = mocks.state.orders.get(orderId);
  if (!order) {
    throw new Error("Expected seeded order");
  }
  return order;
}

function getPaymentByProviderOrderId(providerOrderId: string) {
  return Array.from(mocks.state.payments.values()).find(
    (payment) => payment.providerOrderId === providerOrderId,
  );
}

describe("payment flow routes", () => {
  beforeEach(() => {
    mocks.state.users.clear();
    mocks.state.orders.clear();
    mocks.state.payments.clear();
    mocks.state.cartByUserId.clear();
    mocks.state.paymentSeq = 1;
    mocks.state.providerOrderSeq = 1;

    mocks.requireCustomerSessionMock.mockReset();
    mocks.selectPaymentProviderMock.mockReset();
    mocks.getPaymentProviderMock.mockReset();
    mocks.provider.createPaymentOrder.mockReset();
    mocks.provider.verifyPayment.mockReset();
    mocks.provider.handleWebhookEvent.mockReset();

    mocks.requireCustomerSessionMock.mockResolvedValue({
      user: { id: "user_1" },
    });
    mocks.selectPaymentProviderMock.mockImplementation((explicit?: string) => explicit ?? "simulator");
    mocks.getPaymentProviderMock.mockReturnValue(mocks.provider);
    mocks.provider.createPaymentOrder.mockImplementation(async ({ order }: any) => {
      const providerOrderId = `sim_ord_${mocks.state.providerOrderSeq++}`;
      return {
        providerName: "simulator",
        providerOrderId,
        amountInPaise: order.totalInPaise,
        currency: order.currency,
        clientOptions: { providerOrderId },
      };
    });
    mocks.provider.verifyPayment.mockResolvedValue({
      ok: true,
      methodDetails: { cardLast4: "1111", cardType: "visa" },
    });
  });

  it("creates a new PENDING payment row and returns provider order details", async () => {
    seedUser({ id: "user_1" });
    seedOrder({ id: "ord_1", orderNumber: "DMS-20260705-AAAAA", userId: "user_1" });

    const response = await createPaymentPost(
      makeJsonRequest("http://localhost/api/payments/create", {
        orderNumber: "DMS-20260705-AAAAA",
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.provider).toBe("simulator");
    expect(json.providerOrderId).toBe("sim_ord_1");
    expect(json.paymentId).toBe("pay_1");

    const created = mocks.state.payments.get("pay_1");
    expect(created).toBeDefined();
    expect(created?.status).toBe("PENDING");
    expect(created?.providerOrderId).toBe("sim_ord_1");
  });

  it("marks payment COMPLETED and order CONFIRMED on successful verification", async () => {
    seedUser({ id: "user_1" });
    seedOrder({ id: "ord_1", orderNumber: "DMS-20260705-BBBBB", userId: "user_1" });

    await createPaymentPost(
      makeJsonRequest("http://localhost/api/payments/create", {
        orderNumber: "DMS-20260705-BBBBB",
      }),
    );

    const response = await verifyPaymentPost(
      makeJsonRequest("http://localhost/api/payments/verify", {
        orderNumber: "DMS-20260705-BBBBB",
        providerOrderId: "sim_ord_1",
        providerPaymentId: "SIM-1720000000000-ABCD",
        providerSignature: "sig_success",
        status: "COMPLETED",
        methodDetails: { cardLast4: "1111", cardType: "visa" },
      }),
    );

    expect(response.status).toBe(200);

    const payment = getPaymentByProviderOrderId("sim_ord_1");
    expect(payment?.status).toBe("COMPLETED");
    expect(payment?.providerPaymentId).toBe("SIM-1720000000000-ABCD");
    expect(payment?.errorMessage).toBeNull();

    const order = getOrder("ord_1");
    expect(order.status).toBe("CONFIRMED");
    expect(order.paymentStatus).toBe("COMPLETED");
    expect(order.confirmedAt).toBeInstanceOf(Date);
  });

  it("marks payment FAILED and keeps order pending on verification failure", async () => {
    seedUser({ id: "user_1" });
    seedOrder({ id: "ord_1", orderNumber: "DMS-20260705-CCCCC", userId: "user_1" });
    mocks.provider.verifyPayment.mockResolvedValueOnce({
      ok: false,
      reason: "Card declined",
    });

    await createPaymentPost(
      makeJsonRequest("http://localhost/api/payments/create", {
        orderNumber: "DMS-20260705-CCCCC",
      }),
    );

    const response = await verifyPaymentPost(
      makeJsonRequest("http://localhost/api/payments/verify", {
        orderNumber: "DMS-20260705-CCCCC",
        providerOrderId: "sim_ord_1",
        providerPaymentId: "SIM-1720000000001-FAIL",
        providerSignature: "sig_fail",
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.message.toLowerCase()).toContain("declined");

    const payment = getPaymentByProviderOrderId("sim_ord_1");
    expect(payment?.status).toBe("FAILED");
    expect(payment?.errorMessage?.toLowerCase()).toContain("declined");

    const order = getOrder("ord_1");
    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("PENDING");
  });

  it("creates a new payment row for each attempt and confirms order after later success", async () => {
    seedUser({ id: "user_1" });
    seedOrder({ id: "ord_1", orderNumber: "DMS-20260705-DDDDD", userId: "user_1" });

    await createPaymentPost(
      makeJsonRequest("http://localhost/api/payments/create", {
        orderNumber: "DMS-20260705-DDDDD",
      }),
    );

    mocks.provider.verifyPayment.mockResolvedValueOnce({
      ok: false,
      reason: "Insufficient funds",
    });
    await verifyPaymentPost(
      makeJsonRequest("http://localhost/api/payments/verify", {
        orderNumber: "DMS-20260705-DDDDD",
        providerOrderId: "sim_ord_1",
        providerPaymentId: "SIM-1720000000010-FAIL",
        providerSignature: "sig_fail_1",
      }),
    );

    await createPaymentPost(
      makeJsonRequest("http://localhost/api/payments/create", {
        orderNumber: "DMS-20260705-DDDDD",
      }),
    );

    mocks.provider.verifyPayment.mockResolvedValueOnce({
      ok: true,
      methodDetails: { cardLast4: "1111", cardType: "visa" },
    });
    const secondVerify = await verifyPaymentPost(
      makeJsonRequest("http://localhost/api/payments/verify", {
        orderNumber: "DMS-20260705-DDDDD",
        providerOrderId: "sim_ord_2",
        providerPaymentId: "SIM-1720000000020-SUCC",
        providerSignature: "sig_ok_2",
        status: "COMPLETED",
        methodDetails: { cardLast4: "1111", cardType: "visa" },
      }),
    );

    expect(secondVerify.status).toBe(200);

    const allPayments = Array.from(mocks.state.payments.values()).sort((a, b) => a.id.localeCompare(b.id));
    expect(allPayments).toHaveLength(2);
    expect(allPayments[0].providerOrderId).toBe("sim_ord_1");
    expect(allPayments[0].status).toBe("FAILED");
    expect(allPayments[1].providerOrderId).toBe("sim_ord_2");
    expect(allPayments[1].status).toBe("COMPLETED");

    const order = getOrder("ord_1");
    expect(order.status).toBe("CONFIRMED");
    expect(order.paymentStatus).toBe("COMPLETED");
  });
});
