"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PaymentWidgetProps = {
  orderNumber: string;
  onSuccess: (orderNumber: string) => void;
  onFailure: (reason: string) => void;
};

type ProviderName = "razorpay" | "simulator";

type CreatePaymentResponse = {
  provider: ProviderName;
  paymentId: string;
  providerOrderId: string;
  amountInPaise: number;
  currency: string;
  clientKey?: string;
  clientOptions: Record<string, unknown>;
};

type VerifyResponse = {
  ok?: boolean;
  orderNumber?: string;
  error?: {
    message?: string;
  };
};

type SimulatorSignResponse = {
  providerSignature?: string;
  status?: "COMPLETED" | "FAILED";
  errorMessage?: string | null;
  methodDetails?: {
    cardLast4: string;
    cardType: string;
  };
  error?: {
    message?: string;
  };
};

function formatCurrency(amountInPaise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountInPaise / 100);
}

function createSimulatorTransactionId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SIM-${Date.now()}-${random}`;
}

function formatCardInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiryInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function PaymentWidget({ orderNumber, onSuccess, onFailure }: PaymentWidgetProps) {
  const [config, setConfig] = useState<CreatePaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [razorpayScriptReady, setRazorpayScriptReady] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [simulatorStatus, setSimulatorStatus] = useState<"idle" | "processing" | "success" | "error">(
    "idle",
  );
  const [simulatorMessage, setSimulatorMessage] = useState<string | null>(null);

  const initializePayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCancelled(false);
    setSimulatorStatus("idle");
    setSimulatorMessage(null);
    setCardNumber("");
    setExpiry("");
    setCvv("");

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const json = (await response.json()) as CreatePaymentResponse & {
        error?: { message?: string };
      };

      if (!response.ok) {
        const message = json.error?.message ?? "Could not initialize payment";
        setError(message);
        onFailure(message);
        return;
      }

      setConfig(json);
    } catch (_error) {
      const message = "Could not initialize payment";
      setError(message);
      onFailure(message);
    } finally {
      setLoading(false);
    }
  }, [onFailure, orderNumber]);

  useEffect(() => {
    let cancelledEffect = false;
    void (async () => {
      await initializePayment();
      if (cancelledEffect) {
        return;
      }
    })();
    return () => {
      cancelledEffect = true;
    };
  }, [initializePayment]);

  const amountLabel = useMemo(() => {
    if (!config) {
      return "";
    }
    return formatCurrency(config.amountInPaise, config.currency);
  }, [config]);

  const verifyPayment = async (payload: {
    providerOrderId: string;
    providerPaymentId: string;
    providerSignature: string;
    status?: "COMPLETED" | "FAILED";
    failureReason?: string;
    methodDetails?: {
      cardLast4: string;
      cardType: string;
    };
  }) => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          ...payload,
        }),
      });
      const json = (await response.json()) as VerifyResponse;
      if (!response.ok || !json.ok) {
        const reason = json.error?.message ?? "Payment verification failed";
        setError(reason);
        onFailure(reason);
        return false;
      }

      onSuccess(json.orderNumber ?? orderNumber);
      return true;
    } catch (_error) {
      const reason = "Payment verification failed";
      setError(reason);
      onFailure(reason);
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenRazorpay = () => {
    if (!config) {
      return;
    }
    if (!window.Razorpay) {
      const reason = "Razorpay SDK is not loaded";
      setError(reason);
      onFailure(reason);
      return;
    }

    const options = {
      ...config.clientOptions,
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        void verifyPayment({
          providerOrderId: config.providerOrderId,
          providerPaymentId: response.razorpay_payment_id,
          providerSignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          setCancelled(true);
          setError("Payment cancelled");
        },
      },
    };

    setCancelled(false);
    setError(null);
    const instance = new window.Razorpay(options);
    instance.open();
  };

  const handleSimulatorSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!config) {
      return;
    }

    if (cardNumber.replace(/\s/g, "").length !== 16 || expiry.length !== 5 || cvv.length < 3) {
      const reason = "Enter a valid card number, expiry, and CVV.";
      setError(reason);
      setSimulatorStatus("error");
      setSimulatorMessage(reason);
      return;
    }

    setProcessing(true);
    setSimulatorStatus("processing");
    setSimulatorMessage(null);
    setError(null);
    const providerPaymentId = createSimulatorTransactionId();

    try {
      await sleep(900);
      const signatureResponse = await fetch("/api/payments/simulate-sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerOrderId: config.providerOrderId,
          providerPaymentId,
          cardNumber,
          expiry,
          cvv,
        }),
      });
      const signatureJson = (await signatureResponse.json()) as SimulatorSignResponse;
      if (!signatureResponse.ok || !signatureJson.providerSignature) {
        const reason = signatureJson.error?.message ?? "Could not sign simulator payment";
        setError(reason);
        onFailure(reason);
        setSimulatorStatus("error");
        setSimulatorMessage(reason);
        return;
      }

      const verified = await verifyPayment({
        providerOrderId: config.providerOrderId,
        providerPaymentId,
        providerSignature: signatureJson.providerSignature,
        status: signatureJson.status,
        failureReason: signatureJson.errorMessage ?? undefined,
        methodDetails: signatureJson.methodDetails,
      });

      if (verified) {
        setSimulatorStatus("success");
        setSimulatorMessage("Payment successful");
      } else {
        setSimulatorStatus("error");
        setSimulatorMessage(signatureJson.errorMessage ?? "Payment failed");
      }
    } catch {
      const reason = "Could not process simulator payment";
      setError(reason);
      onFailure(reason);
      setSimulatorStatus("error");
      setSimulatorMessage(reason);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-[#45637A]/25 bg-[#F0F4F8] p-4 text-sm text-[#45637A]">
        Preparing payment...
      </div>
    );
  }

  if (!config) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-700">
        Unable to initialize payment for this order.
      </Alert>
    );
  }

  return (
    <div className="space-y-4 border border-[#45637A]/25 bg-[#F0F4F8] p-5 font-sans">
      {config.provider === "razorpay" ? (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          onLoad={() => setRazorpayScriptReady(true)}
          onError={() => setError("Failed to load Razorpay checkout SDK")}
        />
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[#45637A]">Order {orderNumber}</p>
        {config.provider === "simulator" ? (
          <Badge className="border border-[#45637A]/25 bg-[#DCE8F2] text-[#1A3148]">Simulator</Badge>
        ) : null}
      </div>

      <p className="font-mono text-sm text-[#0D1B2A]">Amount: {amountLabel}</p>

      {config.provider === "razorpay" ? (
        <Button
          type="button"
          onClick={handleOpenRazorpay}
          disabled={processing || !razorpayScriptReady}
          className="w-full rounded-none bg-[#CC5500] font-display text-[#F0F4F8] hover:bg-[#CC5500]/90"
        >
          {processing ? "Verifying..." : `Pay ${amountLabel}`}
        </Button>
      ) : (
        <form className="space-y-3" onSubmit={handleSimulatorSubmit}>
          <div className="space-y-1">
            <label htmlFor="sim-card-number" className="text-xs text-[#1A3148]">
              Card number
            </label>
            <input
              id="sim-card-number"
              value={cardNumber}
              onChange={(event) => setCardNumber(formatCardInput(event.target.value))}
              placeholder="4111 1111 1111 1111"
              autoComplete="cc-number"
              className="w-full border border-[#45637A]/25 bg-[#F0F4F8] px-3 py-2 text-sm text-[#0D1B2A] outline-none focus:border-[#CC5500]"
              disabled={processing}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="sim-expiry" className="text-xs text-[#1A3148]">
                Expiry
              </label>
              <input
                id="sim-expiry"
                value={expiry}
                onChange={(event) => setExpiry(formatExpiryInput(event.target.value))}
                placeholder="MM/YY"
                autoComplete="cc-exp"
                className="w-full border border-[#45637A]/25 bg-[#F0F4F8] px-3 py-2 text-sm text-[#0D1B2A] outline-none focus:border-[#CC5500]"
                disabled={processing}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="sim-cvv" className="text-xs text-[#1A3148]">
                CVV
              </label>
              <input
                id="sim-cvv"
                value={cvv}
                onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                autoComplete="cc-csc"
                className="w-full border border-[#45637A]/25 bg-[#F0F4F8] px-3 py-2 text-sm text-[#0D1B2A] outline-none focus:border-[#CC5500]"
                disabled={processing}
              />
            </div>
          </div>

          <div className="text-xs text-[#45637A]">
            Test cards: `4111...1111` (success), `4000...0002` (decline), `4000...9995` (insufficient funds)
          </div>

          <Button
            type="submit"
            disabled={processing}
            className="w-full rounded-none bg-[#CC5500] font-display text-[#F0F4F8] hover:bg-[#CC5500]/90"
          >
            {processing ? "Processing..." : `Pay ${amountLabel}`}
          </Button>

          {simulatorStatus === "processing" ? (
            <div className="flex items-center gap-2 text-sm text-[#45637A]">
              <LoaderCircle className="h-4 w-4 animate-spin text-[#CC5500]" />
              Processing payment...
            </div>
          ) : null}

          {simulatorStatus === "success" ? (
            <div className="flex items-center gap-2 text-sm text-[#0D1B2A]">
              <CheckCircle2 className="h-4 w-4 text-[#0D1B2A]" />
              {simulatorMessage ?? "Payment successful"}
            </div>
          ) : null}

          {simulatorStatus === "error" ? (
            <div className="space-y-2">
              <p className="text-sm text-[#CC5500]">{simulatorMessage ?? "Payment failed. Please retry."}</p>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-none border-[#45637A]/25 text-[#1A3148]"
                onClick={() => void initializePayment()}
              >
                Retry
              </Button>
            </div>
          ) : null}
        </form>
      )}

      {cancelled ? (
        <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
          Payment cancelled. You can retry.
        </Alert>
      ) : null}

      {error ? (
        <Alert className="border-[#CC5500]/30 bg-[#F0F4F8] text-[#CC5500]">{error}</Alert>
      ) : null}
    </div>
  );
}
