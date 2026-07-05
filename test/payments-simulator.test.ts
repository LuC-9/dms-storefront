import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { createSimulatorSignature, simulatorProvider } from "@/lib/payments/simulator";

const ORIGINAL_SIM_SECRET = process.env.SIMULATOR_SECRET;
const ORIGINAL_NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

describe("simulator payment provider", () => {
  afterEach(() => {
    process.env.SIMULATOR_SECRET = ORIGINAL_SIM_SECRET;
    process.env.NEXTAUTH_SECRET = ORIGINAL_NEXTAUTH_SECRET;
  });

  it("creates payment order payload with simulator shape", async () => {
    process.env.SIMULATOR_SECRET = "unit-test-secret";

    const result = await simulatorProvider.createPaymentOrder({
      order: {
        id: "ord_1",
        orderNumber: "DMS-20260704-ABCDE",
        totalInPaise: 5099,
        currency: "INR",
      },
      customer: {
        id: "cust_1",
        email: "user@example.com",
        name: "Delta User",
      },
    });

    expect(result.providerName).toBe("simulator");
    expect(result.providerOrderId.startsWith("sim_ord_")).toBe(true);
    expect(result.amountInPaise).toBe(5099);
    expect(result.currency).toBe("INR");
    expect(result.clientOptions).toMatchObject({
      orderNumber: "DMS-20260704-ABCDE",
      amount: 5099,
      currency: "INR",
      providerOrderId: result.providerOrderId,
      name: "Delta User",
      email: "user@example.com",
    });
  });

  it("verifies valid signature successfully", async () => {
    process.env.SIMULATOR_SECRET = "unit-test-secret";
    const providerOrderId = "sim_ord_valid";
    const providerPaymentId = "sim_pay_valid";
    const providerSignature = createSimulatorSignature(providerOrderId, providerPaymentId);

    const result = await simulatorProvider.verifyPayment({
      providerOrderId,
      providerPaymentId,
      providerSignature,
    });

    expect(result).toEqual({ ok: true });
  });

  it("rejects invalid payment signature", async () => {
    process.env.SIMULATOR_SECRET = "unit-test-secret";
    const result = await simulatorProvider.verifyPayment({
      providerOrderId: "sim_ord_valid",
      providerPaymentId: "sim_pay_valid",
      providerSignature: "deadbeef",
    });

    expect(result.ok).toBe(false);
    expect(typeof result.reason).toBe("string");
  });

  it("rejects missing webhook signature", async () => {
    process.env.SIMULATOR_SECRET = "unit-test-secret";
    await expect(
      simulatorProvider.handleWebhookEvent({
        rawBody: JSON.stringify({ status: "COMPLETED" }),
        signature: "",
      }),
    ).rejects.toThrow("Missing simulator webhook signature");
  });

  it("accepts valid webhook signature and parses status", async () => {
    process.env.SIMULATOR_SECRET = "unit-test-secret";
    const payload = {
      status: "COMPLETED",
      providerOrderId: "sim_ord_ok",
      providerPaymentId: "sim_pay_ok",
      raw: { any: "value" },
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", process.env.SIMULATOR_SECRET)
      .update(rawBody)
      .digest("hex");

    const result = await simulatorProvider.handleWebhookEvent({ rawBody, signature });
    expect(result).toEqual({
      providerOrderId: "sim_ord_ok",
      providerPaymentId: "sim_pay_ok",
      status: "COMPLETED",
      raw: { any: "value" },
    });
  });

  it("rejects invalid webhook signature", async () => {
    process.env.SIMULATOR_SECRET = "unit-test-secret";
    const rawBody = JSON.stringify({
      status: "FAILED",
      providerOrderId: "sim_ord_bad",
      providerPaymentId: "sim_pay_bad",
    });

    await expect(
      simulatorProvider.handleWebhookEvent({
        rawBody,
        signature: "deadbeef",
      }),
    ).rejects.toThrow("Invalid simulator webhook signature");
  });
});
