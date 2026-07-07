import crypto from "node:crypto";
import Razorpay from "razorpay";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookInput,
  WebhookResult,
} from "@/lib/payments/provider";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
    refund?: {
      entity?: {
        payment_id?: string;
      };
    };
  };
};

function timingSafeHexEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function requireEnv(name: "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET" | "RAZORPAY_WEBHOOK_SECRET") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getClient() {
  return new Razorpay({
    key_id: requireEnv("RAZORPAY_KEY_ID"),
    key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
  });
}

async function createPaymentOrder(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const client = getClient();
  const created = await client.orders.create({
    amount: input.order.totalInPaise,
    currency: input.order.currency,
    receipt: input.order.orderNumber,
    notes: {
      orderId: input.order.id,
    },
  });

  return {
    providerName: "razorpay",
    providerOrderId: created.id,
    amountInPaise: input.order.totalInPaise,
    currency: input.order.currency,
    clientKey: requireEnv("RAZORPAY_KEY_ID"),
    clientOptions: {
      key: requireEnv("RAZORPAY_KEY_ID"),
      amount: input.order.totalInPaise,
      currency: input.order.currency,
      name: "Delta Mills Store",
      description: `Order ${input.order.orderNumber}`,
      order_id: created.id,
      prefill: {
        name: input.customer.name,
        email: input.customer.email,
        contact: input.customer.phone ?? undefined,
      },
      theme: { color: "#1f2937" },
      notes: { orderId: input.order.id },
    },
  };
}

async function verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  const secret = requireEnv("RAZORPAY_KEY_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${input.providerOrderId}|${input.providerPaymentId}`)
    .digest("hex");

  const ok = timingSafeHexEqual(expected, input.providerSignature);
  if (!ok) {
    return { ok: false, reason: "Signature mismatch" };
  }
  return { ok: true };
}

function mapWebhookStatus(event?: string): WebhookResult["status"] | null {
  if (event === "payment.captured") {
    return "COMPLETED";
  }
  if (event === "payment.failed") {
    return "FAILED";
  }
  if (event === "refund.processed") {
    return "REFUNDED";
  }
  return null;
}

async function handleWebhookEvent(input: WebhookInput): Promise<WebhookResult> {
  const webhookSecret = requireEnv("RAZORPAY_WEBHOOK_SECRET");
  const expected = crypto.createHmac("sha256", webhookSecret).update(input.rawBody).digest("hex");
  if (!timingSafeHexEqual(expected, input.signature)) {
    throw new Error("Invalid webhook signature");
  }

  const payload = JSON.parse(input.rawBody) as RazorpayWebhookPayload;
  const status = mapWebhookStatus(payload.event);
  if (!status) {
    throw new Error(`Unsupported Razorpay event: ${payload.event ?? "unknown"}`);
  }

  const providerOrderId = payload.payload?.payment?.entity?.order_id;
  const providerPaymentId =
    payload.payload?.payment?.entity?.id ?? payload.payload?.refund?.entity?.payment_id;

  return {
    providerOrderId,
    providerPaymentId,
    status,
    raw: payload,
  };
}

export const razorpayProvider: PaymentProvider = {
  name: "razorpay",
  createPaymentOrder,
  verifyPayment,
  handleWebhookEvent,
};
