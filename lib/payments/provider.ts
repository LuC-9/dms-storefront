import { selectPaymentProvider, type PaymentProvider as PaymentProviderName } from "@/lib/payments/select";
import { razorpayProvider } from "@/lib/payments/razorpay";
import { simulatorProvider } from "@/lib/payments/simulator";

export type CreatePaymentInput = {
  order: { id: string; orderNumber: string; totalInPaise: number; currency: string };
  customer: { id: string; email: string; name: string; phone?: string | null };
};

export type CreatePaymentResult = {
  providerName: PaymentProviderName;
  providerOrderId: string;
  amountInPaise: number;
  currency: string;
  clientKey?: string;
  clientOptions: Record<string, unknown>;
};

export type VerifyPaymentInput = {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
  metadata?: Record<string, unknown>;
};

export type VerifyPaymentResult = {
  ok: boolean;
  reason?: string;
  methodDetails?: Record<string, unknown>;
};

export type WebhookInput = { rawBody: string; signature: string };

export type WebhookResult = {
  providerOrderId?: string;
  providerPaymentId?: string;
  status: "COMPLETED" | "FAILED" | "REFUNDED";
  raw?: unknown;
};

export interface PaymentProvider {
  name: PaymentProviderName;
  createPaymentOrder(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  handleWebhookEvent(input: WebhookInput): Promise<WebhookResult>;
}

const providers: Record<PaymentProviderName, PaymentProvider> = {
  razorpay: razorpayProvider,
  simulator: simulatorProvider,
};

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
  return providers[name];
}

export function getSelectedPaymentProvider(explicit?: string): PaymentProvider {
  return getPaymentProvider(selectPaymentProvider(explicit));
}
