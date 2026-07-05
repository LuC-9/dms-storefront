import crypto from "node:crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookInput,
  WebhookResult,
} from "@/lib/payments/provider";

type SimulatorWebhookPayload = {
  status?: "COMPLETED" | "FAILED" | "REFUNDED";
  providerOrderId?: string;
  providerPaymentId?: string;
  raw?: unknown;
};

type SimulatorVerificationMetadata = {
  status: "COMPLETED" | "FAILED";
  errorMessage: string | null;
  cardLast4: string;
  cardType: string;
};

type SimulatorCardResult = {
  status: "COMPLETED" | "FAILED";
  errorMessage: string | null;
  methodDetails: {
    cardLast4: string;
    cardType: string;
  };
};

function getSimulatorSecret() {
  const simulatorSecret = process.env.SIMULATOR_SECRET?.trim();
  if (simulatorSecret) {
    return simulatorSecret;
  }

  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();
  if (!nextAuthSecret) {
    throw new Error("SIMULATOR_SECRET or NEXTAUTH_SECRET must be set");
  }

  return crypto.createHash("sha256").update(`simulator:${nextAuthSecret}`).digest("hex");
}

function timingSafeHexEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSimulatorSignature(providerOrderId: string, providerPaymentId: string) {
  return crypto
    .createHmac("sha256", getSimulatorSecret())
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest("hex");
}

export function createSimulatorVerificationSignature(input: {
  providerOrderId: string;
  providerPaymentId: string;
  status: "COMPLETED" | "FAILED";
  errorMessage: string | null;
  cardLast4: string;
  cardType: string;
}) {
  const payload = [
    input.providerOrderId,
    input.providerPaymentId,
    input.status,
    input.errorMessage ?? "",
    input.cardLast4,
    input.cardType,
  ].join("|");

  return crypto.createHmac("sha256", getSimulatorSecret()).update(payload).digest("hex");
}

export function getSimulatorCardOutcome(cardNumberRaw: string): SimulatorCardResult {
  const digits = cardNumberRaw.replace(/\D/g, "");
  const last4 = digits.slice(-4).padStart(4, "0");

  if (digits === "4111111111111111") {
    return {
      status: "COMPLETED",
      errorMessage: null,
      methodDetails: {
        cardLast4: last4,
        cardType: "visa",
      },
    };
  }

  if (digits === "4000000000000002") {
    return {
      status: "FAILED",
      errorMessage: "Card declined",
      methodDetails: {
        cardLast4: last4,
        cardType: "visa",
      },
    };
  }

  if (digits === "4000000000009995") {
    return {
      status: "FAILED",
      errorMessage: "Insufficient funds",
      methodDetails: {
        cardLast4: last4,
        cardType: "visa",
      },
    };
  }

  return {
    status: "FAILED",
    errorMessage: "Unsupported test card",
    methodDetails: {
      cardLast4: last4,
      cardType: digits.startsWith("4") ? "visa" : "card",
    },
  };
}

async function createPaymentOrder(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const providerOrderId = `sim_ord_${crypto.randomBytes(8).toString("hex")}`;
  return {
    providerName: "simulator",
    providerOrderId,
    amountInPaise: input.order.totalInPaise,
    currency: input.order.currency,
    clientOptions: {
      orderNumber: input.order.orderNumber,
      amount: input.order.totalInPaise,
      currency: input.order.currency,
      providerOrderId,
      name: input.customer.name,
      email: input.customer.email,
    },
  };
}

async function verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  const metadata = (input.metadata ?? {}) as Partial<SimulatorVerificationMetadata>;
  if (!metadata.status || !metadata.cardLast4 || !metadata.cardType) {
    const expected = createSimulatorSignature(input.providerOrderId, input.providerPaymentId);
    const ok = timingSafeHexEqual(expected, input.providerSignature);
    if (!ok) {
      return { ok: false, reason: "Simulator signature mismatch" };
    }
    return { ok: true };
  }

  const expected = createSimulatorVerificationSignature({
    providerOrderId: input.providerOrderId,
    providerPaymentId: input.providerPaymentId,
    status: metadata.status,
    errorMessage: metadata.errorMessage ?? null,
    cardLast4: metadata.cardLast4,
    cardType: metadata.cardType,
  });
  const ok = timingSafeHexEqual(expected, input.providerSignature);
  if (!ok) {
    return { ok: false, reason: "Simulator signature mismatch" };
  }
  if (metadata.status === "FAILED") {
    return {
      ok: false,
      reason: metadata.errorMessage ?? "Payment failed",
      methodDetails: { cardLast4: metadata.cardLast4, cardType: metadata.cardType },
    };
  }

  return { ok: true, methodDetails: { cardLast4: metadata.cardLast4, cardType: metadata.cardType } };
}

async function handleWebhookEvent(input: WebhookInput): Promise<WebhookResult> {
  if (!input.signature.trim()) {
    throw new Error("Missing simulator webhook signature");
  }

  const expected = crypto.createHmac("sha256", getSimulatorSecret()).update(input.rawBody).digest("hex");
  if (!timingSafeHexEqual(expected, input.signature)) {
    throw new Error("Invalid simulator webhook signature");
  }

  const payload = JSON.parse(input.rawBody) as SimulatorWebhookPayload;
  return {
    providerOrderId: payload.providerOrderId,
    providerPaymentId: payload.providerPaymentId,
    status: payload.status ?? "FAILED",
    raw: payload.raw ?? payload,
  };
}

export const simulatorProvider: PaymentProvider = {
  name: "simulator",
  createPaymentOrder,
  verifyPayment,
  handleWebhookEvent,
};
