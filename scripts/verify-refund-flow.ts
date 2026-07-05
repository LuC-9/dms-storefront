/**
 * Throwaway runtime verification for refund/cancel flow.
 * Usage: npx tsx scripts/verify-refund-flow.ts <fixtures-json-file>
 * Requires dev server on BASE_URL (default http://localhost:3000).
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();

type Fixtures = {
  prefix: string;
  password: string;
  customer: { id: string; email: string };
  customer2: { id: string; email: string };
  superAdmin: { id: string; username: string };
  manager: { id: string; username: string };
  orderA: { id: string; orderNumber: string; userId: string | null; totalInPaise: number };
  orderB: { id: string; orderNumber: string; userId: string | null; totalInPaise: number };
  orderC: { id: string; orderNumber: string; userId: string | null; totalInPaise: number };
  orderD: { id: string; orderNumber: string; userId: string | null; totalInPaise: number };
};

type ScenarioResult = {
  scenario: number;
  name: string;
  request: string;
  status: number;
  bodySummary: string;
  dbDelta: string;
  pass: boolean;
  expected?: string;
  actual?: string;
};

async function getSessionCookie(provider: "customer" | "admin", creds: Record<string, string>): Promise<string> {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const cookies = csrfRes.headers.getSetCookie?.() ?? [];

  const body = new URLSearchParams({
    csrfToken,
    callbackUrl: `${BASE_URL}/`,
    json: "true",
    ...creds,
  });

  const signInRes = await fetch(`${BASE_URL}/api/auth/callback/${provider}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies.join("; "),
    },
    body: body.toString(),
    redirect: "manual",
  });

  const allCookies = [...cookies, ...(signInRes.headers.getSetCookie?.() ?? [])];
  const sessionCookie = allCookies.find((c) => c.startsWith("next-auth.session-token=") || c.startsWith("__Secure-next-auth.session-token="));
  if (!sessionCookie) {
    const text = await signInRes.text();
    throw new Error(`No session cookie for ${provider}. Status=${signInRes.status} Body=${text.slice(0, 200)}`);
  }
  return sessionCookie.split(";")[0];
}

async function api(
  method: string,
  path: string,
  cookie: string,
  body?: unknown,
): Promise<{ status: number; json: unknown; text: string }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Cookie: cookie,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json, text };
}

function summarizeBody(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (o.error && typeof o.error === "object") {
      const err = o.error as Record<string, unknown>;
      return `error.code=${err.code}`;
    }
    if (o.ok) return "ok=true";
    return JSON.stringify(json).slice(0, 120);
  }
  return String(json).slice(0, 120);
}

async function orderSnapshot(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      cancellationReason: true,
      cancelledAt: true,
      cancelledBy: true,
      paymentStatus: true,
      payments: { select: { status: true } },
      refunds: { select: { id: true, amountInPaise: true, type: true, reason: true, initiatedBy: true, status: true } },
    },
  });
}

async function main() {
  const fixturesPath = process.argv[2] ?? "scripts/.verify-fixtures.json";
  const fx: Fixtures = JSON.parse(readFileSync(fixturesPath, "utf8"));
  const results: ScenarioResult[] = [];

  const customerCookie = await getSessionCookie("customer", {
    email: fx.customer.email,
    password: fx.password,
  });
  const customer2Cookie = await getSessionCookie("customer", {
    email: fx.customer2.email,
    password: fx.password,
  });
  const superAdminCookie = await getSessionCookie("admin", {
    username: fx.superAdmin.username,
    password: fx.password,
  });
  const managerCookie = await getSessionCookie("admin", {
    username: fx.manager.username,
    password: fx.password,
  });

  // Scenario 1: Cancel unpaid PENDING order A
  {
    const before = await orderSnapshot(fx.orderA.id);
    const res = await api("POST", `/api/orders/${fx.orderA.orderNumber}/cancel`, customerCookie, {
      reason: "Changed my mind",
    });
    const after = await orderSnapshot(fx.orderA.id);
    const pass =
      res.status === 200 &&
      after?.status === "CANCELLED" &&
      after.cancellationReason === "Changed my mind" &&
      !!after.cancelledAt &&
      after.cancelledBy === fx.customer.email &&
      (after.refunds?.length ?? 0) === 0;
    results.push({
      scenario: 1,
      name: "Customer cancels PENDING unpaid order A",
      request: `POST /api/orders/${fx.orderA.orderNumber}/cancel {"reason":"Changed my mind"}`,
      status: res.status,
      bodySummary: summarizeBody(res.json),
      dbDelta: `status ${before?.status}->${after?.status}, refunds=${after?.refunds.length}`,
      pass,
      expected: "200, CANCELLED, no refund",
      actual: pass ? "match" : JSON.stringify(after),
    });
  }

  // Scenario 2: Cancel paid CONFIRMED order B
  {
    const before = await orderSnapshot(fx.orderB.id);
    const res = await api("POST", `/api/orders/${fx.orderB.orderNumber}/cancel`, customerCookie, {
      reason: "Other: found faster shipping",
    });
    const after = await orderSnapshot(fx.orderB.id);
    const payment = after?.payments[0];
    const refund = after?.refunds[0];
    const pass =
      res.status === 200 &&
      after?.status === "CANCELLED" &&
      refund?.amountInPaise === fx.orderB.totalInPaise &&
      payment?.status === "REFUNDED";
    results.push({
      scenario: 2,
      name: "Customer cancels CONFIRMED paid order B",
      request: `POST /api/orders/${fx.orderB.orderNumber}/cancel {"reason":"Other: found faster shipping"}`,
      status: res.status,
      bodySummary: summarizeBody(res.json),
      dbDelta: `status->${after?.status}, refund=${refund?.amountInPaise}, payment=${payment?.status}`,
      pass,
    });
  }

  // Scenario 3: Cancel refused on PROCESSING order C
  {
    const before = await orderSnapshot(fx.orderC.id);
    const res = await api("POST", `/api/orders/${fx.orderC.orderNumber}/cancel`, customerCookie, {
      reason: "Changed mind",
    });
    const after = await orderSnapshot(fx.orderC.id);
    const code = (res.json as { error?: { code?: string } })?.error?.code;
    const pass = res.status === 409 && code === "INVALID_STATUS_FOR_CUSTOMER_CANCEL" && after?.status === before?.status;
    results.push({
      scenario: 3,
      name: "Customer cancel refused on PROCESSING order C",
      request: `POST /api/orders/${fx.orderC.orderNumber}/cancel`,
      status: res.status,
      bodySummary: summarizeBody(res.json),
      dbDelta: `status unchanged: ${after?.status}`,
      pass,
      expected: "409 INVALID_STATUS_FOR_CUSTOMER_CANCEL",
      actual: `${res.status} ${code}`,
    });
  }

  // Scenario 4: Cancel refused for different user (use order A which is already cancelled - need fresh pending)
  // Create a fresh pending order for this test
  const freshPending = await prisma.order.create({
    data: {
      orderNumber: `${fx.prefix}-A2`,
      userId: fx.customer.id,
      status: "PENDING",
      subtotalInPaise: 1000,
      totalInPaise: 1000,
      paymentStatus: "PENDING",
      shippingAddressJson: "{}",
    },
  });
  {
    const before = await orderSnapshot(freshPending.id);
    const res = await api("POST", `/api/orders/${freshPending.orderNumber}/cancel`, customer2Cookie, {
      reason: "Not mine",
    });
    const after = await orderSnapshot(freshPending.id);
    const code = (res.json as { error?: { code?: string } })?.error?.code;
    const pass = res.status === 403 && code === "FORBIDDEN" && after?.status === before?.status;
    results.push({
      scenario: 4,
      name: "Customer cancel refused for different user",
      request: `POST /api/orders/${freshPending.orderNumber}/cancel as customer2`,
      status: res.status,
      bodySummary: summarizeBody(res.json),
      dbDelta: `status unchanged: ${after?.status}`,
      pass,
    });
  }

  // Scenario 5: Admin FULL refund + cancel on order C
  {
    const before = await orderSnapshot(fx.orderC.id);
    const res = await api("POST", `/api/admin/orders/${fx.orderC.id}/refund`, superAdminCookie, {
      type: "FULL",
      amountInPaise: fx.orderC.totalInPaise,
      reason: "Out of stock",
      cancelOrder: true,
    });
    const after = await orderSnapshot(fx.orderC.id);
    const refund = after?.refunds.find((r) => r.reason === "Out of stock");
    const pass =
      res.status === 200 &&
      after?.status === "CANCELLED" &&
      after.cancellationReason === "Out of stock" &&
      after.payments[0]?.status === "REFUNDED" &&
      refund?.type === "FULL" &&
      refund?.initiatedBy === fx.superAdmin.username;
    results.push({
      scenario: 5,
      name: "Admin FULL refund + cancel on order C",
      request: `POST /api/admin/orders/${fx.orderC.id}/refund FULL cancelOrder=true`,
      status: res.status,
      bodySummary: summarizeBody(res.json),
      dbDelta: `status ${before?.status}->${after?.status}, refund type=${refund?.type}, initiatedBy=${refund?.initiatedBy}`,
      pass,
    });
  }

  // Scenario 6: Partial refunds on fresh order E
  const orderE = await prisma.order.create({
    data: {
      orderNumber: `${fx.prefix}-E`,
      userId: fx.customer.id,
      status: "CONFIRMED",
      subtotalInPaise: 1000,
      totalInPaise: 1000,
      paymentStatus: "COMPLETED",
      shippingAddressJson: "{}",
      confirmedAt: new Date(),
      payments: {
        create: {
          provider: "simulator",
          amountInPaise: 1000,
          status: "COMPLETED",
          providerPaymentId: `sim-${fx.prefix}-E`,
        },
      },
    },
    include: { payments: true },
  });

  {
    const res1 = await api("POST", `/api/admin/orders/${orderE.id}/refund`, superAdminCookie, {
      type: "PARTIAL",
      amountInPaise: 400,
      reason: "Partial 1",
      cancelOrder: false,
    });
    const snap1 = await orderSnapshot(orderE.id);
    const pass1 = res1.status === 200 && snap1?.payments[0]?.status === "COMPLETED";

    const res2 = await api("POST", `/api/admin/orders/${orderE.id}/refund`, superAdminCookie, {
      type: "PARTIAL",
      amountInPaise: 600,
      reason: "Partial 2",
      cancelOrder: false,
    });
    const snap2 = await orderSnapshot(orderE.id);
    const pass2 = res2.status === 200 && snap2?.payments[0]?.status === "REFUNDED";

    const res3 = await api("POST", `/api/admin/orders/${orderE.id}/refund`, superAdminCookie, {
      type: "PARTIAL",
      amountInPaise: 100,
      reason: "Over refund",
      cancelOrder: false,
    });
    const code3 = (res3.json as { error?: { code?: string } })?.error?.code;
    const pass3 = res3.status === 422 && code3 === "AMOUNT_EXCEEDS_REMAINING";

    results.push({
      scenario: 6,
      name: "Admin PARTIAL refunds summing to total on order E",
      request: "POST partial 400, 600, then 100 (expect 422)",
      status: res3.status,
      bodySummary: `6a=${res1.status} 6b=${res2.status} 6c=${res3.status} code=${code3}`,
      dbDelta: `payment after partials: ${snap2?.payments[0]?.status}, refunds=${snap2?.refunds.length}`,
      pass: pass1 && pass2 && pass3,
      expected: "200,200,422 AMOUNT_EXCEEDS_REMAINING",
      actual: `${res1.status},${res2.status},${res3.status} ${code3}`,
    });
  }

  // Scenario 7: MANAGER rejected
  {
    const res = await api("POST", `/api/admin/orders/${fx.orderD.id}/refund`, managerCookie, {
      type: "FULL",
      amountInPaise: fx.orderD.totalInPaise,
      reason: "Out of stock",
      cancelOrder: true,
    });
    const code = (res.json as { error?: { code?: string } })?.error?.code;
    const pass = res.status === 403 && code === "FORBIDDEN";
    results.push({
      scenario: 7,
      name: "Admin refund rejected for MANAGER role",
      request: `POST /api/admin/orders/${fx.orderD.id}/refund as MANAGER`,
      status: res.status,
      bodySummary: summarizeBody(res.json),
      dbDelta: "no change expected",
      pass,
    });
  }

  // Scenario 8: DELIVERED order D cancel refused
  {
    const before = await orderSnapshot(fx.orderD.id);
    const res = await api("POST", `/api/admin/orders/${fx.orderD.id}/refund`, superAdminCookie, {
      type: "FULL",
      amountInPaise: fx.orderD.totalInPaise,
      reason: "Cancel delivered",
      cancelOrder: true,
    });
    const after = await orderSnapshot(fx.orderD.id);
    const code = (res.json as { error?: { code?: string } })?.error?.code;
    const pass =
      res.status === 409 &&
      code === "ORDER_ALREADY_DELIVERED" &&
      after?.status === before?.status &&
      after?.payments[0]?.status === before?.payments[0]?.status;
    results.push({
      scenario: 8,
      name: "Admin cancel-and-refund refused on DELIVERED order D",
      request: `POST /api/admin/orders/${fx.orderD.id}/refund cancelOrder=true`,
      status: res.status,
      bodySummary: summarizeBody(res.json),
      dbDelta: `status=${after?.status}, payment=${after?.payments[0]?.status}`,
      pass,
    });
  }

  // Scenario 9: Refund history endpoints
  {
    const custRes = await api("GET", `/api/orders/${fx.orderB.orderNumber}/refunds`, customerCookie);
    const custBody = custRes.json as {
      totalRefundedInPaise?: number;
      remainingRefundableInPaise?: number;
      refunds?: unknown[];
    };
    const adminRes = await api("GET", `/api/admin/orders/${fx.orderC.id}/refunds`, superAdminCookie);
    const adminBody = adminRes.json as { refunds?: unknown[]; totalRefundedInPaise?: number };

    const pass =
      custRes.status === 200 &&
      (custBody.refunds?.length ?? 0) >= 1 &&
      custBody.totalRefundedInPaise === fx.orderB.totalInPaise &&
      custBody.remainingRefundableInPaise === 0 &&
      adminRes.status === 200 &&
      (adminBody.refunds?.length ?? 0) >= 1 &&
      adminBody.totalRefundedInPaise === fx.orderC.totalInPaise;

    results.push({
      scenario: 9,
      name: "Refund history endpoints",
      request: `GET customer B refunds + admin C refunds`,
      status: custRes.status,
      bodySummary: `cust total=${custBody.totalRefundedInPaise} remain=${custBody.remainingRefundableInPaise}; admin total=${adminBody.totalRefundedInPaise}`,
      dbDelta: `cust refunds=${custBody.refunds?.length}, admin refunds=${adminBody.refunds?.length}`,
      pass,
    });
  }

  // Scenario 10: Admin stats
  {
    const res = await api("GET", "/api/admin/stats", superAdminCookie);
    const body = res.json as { refundsThisMonth?: { count?: number; totalInPaise?: number } };
    const expectedMinCount = 3; // scenarios 2, 5, 6a, 6b = 4 refunds
    const pass = res.status === 200 && (body.refundsThisMonth?.count ?? 0) >= expectedMinCount;
    results.push({
      scenario: 10,
      name: "Admin dashboard refund stats",
      request: "GET /api/admin/stats",
      status: res.status,
      bodySummary: `refundsThisMonth count=${body.refundsThisMonth?.count} total=${body.refundsThisMonth?.totalInPaise}`,
      dbDelta: "aggregate query",
      pass,
      expected: `count>=${expectedMinCount}`,
      actual: String(body.refundsThisMonth?.count),
    });
  }

  writeFileSync("scripts/.verify-results.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.error(`\n${failed.length} scenario(s) FAILED`);
    process.exit(1);
  }
  console.log("\nAll scenarios PASSED");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
