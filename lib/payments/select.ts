export type PaymentProvider = "razorpay" | "simulator";

function hasRazorpayEnv() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function selectPaymentProvider(explicit?: string): PaymentProvider {
  if (explicit === "razorpay" || explicit === "simulator") {
    return explicit;
  }

  const envProvider = process.env.PAYMENT_PROVIDER;
  if (envProvider === "razorpay" || envProvider === "simulator") {
    return envProvider;
  }

  return hasRazorpayEnv() ? "razorpay" : "simulator";
}
