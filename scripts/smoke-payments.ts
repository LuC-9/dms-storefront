import { getPaymentProvider } from "@/lib/payments/provider";
import { createSimulatorSignature } from "@/lib/payments/simulator";

async function run() {
  const input = {
    order: {
      id: "ord_smoke_01",
      orderNumber: "DMS-SMOKE-0001",
      totalInPaise: 49900,
      currency: "INR",
    },
    customer: {
      id: "cust_smoke_01",
      email: "smoke@example.com",
      name: "Smoke User",
      phone: "9876543210",
    },
  };

  const simulator = getPaymentProvider("simulator");
  const simulatorCreated = await simulator.createPaymentOrder(input);
  const simulatorPaymentId = "sim_pay_smoke_01";
  const simulatorSignature = createSimulatorSignature(
    simulatorCreated.providerOrderId,
    simulatorPaymentId,
  );
  const simulatorVerified = await simulator.verifyPayment({
    providerOrderId: simulatorCreated.providerOrderId,
    providerPaymentId: simulatorPaymentId,
    providerSignature: simulatorSignature,
  });

  console.log("smoke.payments.simulator.create", simulatorCreated);
  console.log("smoke.payments.simulator.verify", simulatorVerified);

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log("smoke.payments.razorpay.skip", "Missing test keys");
    return;
  }

  const razorpay = getPaymentProvider("razorpay");
  try {
    const razorpayCreated = await razorpay.createPaymentOrder(input);
    console.log("smoke.payments.razorpay.create", razorpayCreated);
  } catch (error) {
    console.log(
      "smoke.payments.razorpay.error",
      error instanceof Error ? error.message : "Unknown Razorpay error",
    );
  }
}

void run();
