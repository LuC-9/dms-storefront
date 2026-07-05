"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/components/storefront/cart-context";
import { Price } from "@/components/storefront/price";
import { toast } from "@/components/ui/toast";

type Address = {
  id: string;
  label?: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type CheckoutResponse = {
  orderNumber: string;
  orderId: string;
  totalInPaise: number;
  currency: string;
  provider: string;
};

function PaymentWidgetUnavailable({
  reason,
  orderNumber,
}: {
  reason: string;
  orderNumber: string;
}) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="font-medium text-amber-800">Payment provider not yet available</p>
      <p className="mt-1 text-sm text-amber-700">{reason}</p>
      <p className="mt-2 text-xs text-amber-700">Order created: {orderNumber}</p>
    </div>
  );
}

const LazyPaymentWidget = dynamic(
  async () => {
    try {
      const mod = await import("@/components/checkout/payment-widget");
      return mod.PaymentWidget;
    } catch (error) {
      console.warn("PaymentWidget not available:", error);
      return ({ orderNumber }: { orderNumber: string }) => (
        <PaymentWidgetUnavailable
          reason="Checkout widget module is not available in this build."
          orderNumber={orderNumber}
        />
      );
    }
  },
  {
    ssr: false,
    loading: () => <div className="rounded-md border border-steel-200 p-4 text-sm">Loading payment widget...</div>,
  },
);

const SHIPPING_FLAT_PAISE = 0;

const stepItems = [
  { id: 1, label: "ADDRESS" },
  { id: 2, label: "REVIEW" },
  { id: 3, label: "PAYMENT" },
];

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isCustomer = session?.user?.userType === "customer";
  const { items, subtotalInPaise, itemCount, isLoading: cartLoading, refresh } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [paymentRetryKey, setPaymentRetryKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [newAddress, setNewAddress] = useState({
    label: "",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const rawStep = Number.parseInt(searchParams.get("step") ?? "1", 10);
  const step = Number.isFinite(rawStep) && rawStep >= 1 && rawStep <= 3 ? rawStep : 1;
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;
  const totalInPaise = checkout?.totalInPaise ?? subtotalInPaise + SHIPPING_FLAT_PAISE;

  const addressPayload = useMemo(
    () => ({
      label: newAddress.label || undefined,
      fullName: newAddress.fullName,
      phone: newAddress.phone,
      line1: newAddress.line1,
      line2: newAddress.line2 || undefined,
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.pincode,
      isDefault: newAddress.isDefault,
    }),
    [newAddress],
  );

  const goToStep = (nextStep: number) => {
    router.replace(`/checkout?step=${nextStep}`);
  };

  const refreshAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await fetch("/api/addresses", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not fetch addresses");
      }
      const json = (await response.json()) as { items: Address[] };
      setAddresses(json.items ?? []);
      if (!selectedAddressId) {
        const defaultAddress = (json.items ?? []).find((address) => address.isDefault);
        setSelectedAddressId(defaultAddress?.id ?? json.items?.[0]?.id ?? null);
      }
    } catch {
      setError("Could not load addresses.");
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isCustomer)) {
      router.replace("/login?callbackUrl=/checkout");
    }
  }, [isCustomer, router, status]);

  useEffect(() => {
    if (status === "authenticated") {
      void refreshAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    if (!cartLoading && itemCount === 0) {
      toast("Cart is empty");
      router.replace("/cart");
    }
  }, [cartLoading, itemCount, router, status]);

  useEffect(() => {
    if (step !== 3 || !selectedAddressId || checkout) {
      return;
    }

    const createOrder = async () => {
      setCreatingOrder(true);
      setError(null);
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addressId: selectedAddressId,
            notes: notes || undefined,
          }),
        });

        const json = (await response.json()) as CheckoutResponse & { error?: { message?: string } };
        if (!response.ok) {
          setError(json.error?.message ?? "Could not initialize checkout.");
          return;
        }
        setCheckout(json);
        setPaymentRetryKey(0);
        await refresh();
      } catch {
        setError("Could not initialize checkout.");
      } finally {
        setCreatingOrder(false);
      }
    };

    void createOrder();
  }, [checkout, notes, refresh, selectedAddressId, step]);

  if (status === "loading" || status === "unauthenticated" || !isCustomer) {
    return <div className="container py-10 text-sm text-steel-600">Preparing checkout...</div>;
  }

  return (
    <div className="container space-y-6 py-8 md:py-12">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Checkout</h1>
        <p className="mt-1 text-sm text-steel-500">Complete your order in three quick steps.</p>
      </div>

      <div className="overflow-hidden border border-steel-500/25 bg-alloy-white">
        <div className="h-1 w-full bg-blueprint-100">
          <div
            className="h-full bg-safety-orange transition-all duration-300 ease-in-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
        {stepItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`border p-3 text-left ${
              step >= item.id
                ? "border-safety-orange bg-safety-orange/10 text-safety-orange"
                : "border-steel-500/25 text-steel-500"
            }`}
            onClick={() => {
              if (item.id === 1 || (item.id === 2 && selectedAddressId) || (item.id === 3 && checkout)) {
                goToStep(item.id);
              }
            }}
          >
            <p className="font-mono text-xs tracking-[0.03em]">{step >= item.id ? "●" : "○"} {item.label}</p>
          </button>
        ))}
        </div>
      </div>

      {step === 1 ? (
        <section className="space-y-4 border border-steel-500/25 bg-alloy-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">
              Delivery address
            </h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-none border-forge-950">
                  Add new address
                </Button>
              </DialogTrigger>
              <DialogContent className="border-steel-500 bg-alloy-white">
                <DialogHeader>
                  <DialogTitle>Add address</DialogTitle>
                  <DialogDescription>Save a delivery address for checkout.</DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-3"
                  onSubmit={async (event: FormEvent) => {
                    event.preventDefault();
                    const response = await fetch("/api/addresses", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(addressPayload),
                    });
                    if (!response.ok) {
                      setError("Could not save address.");
                      return;
                    }
                    const created = (await response.json()) as Address;
                    setSelectedAddressId(created.id);
                    setNewAddress({
                      label: "",
                      fullName: "",
                      phone: "",
                      line1: "",
                      line2: "",
                      city: "",
                      state: "",
                      pincode: "",
                      isDefault: false,
                    });
                    await refreshAddresses();
                    toast("Address added");
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="address-label">Label</Label>
                      <Input
                        id="address-label"
                        value={newAddress.label}
                        onChange={(event) =>
                          setNewAddress((prev) => ({ ...prev, label: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="address-fullName">Full name</Label>
                      <Input
                        id="address-fullName"
                        required
                        value={newAddress.fullName}
                        onChange={(event) =>
                          setNewAddress((prev) => ({ ...prev, fullName: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="address-phone">Phone</Label>
                      <Input
                        id="address-phone"
                        required
                        value={newAddress.phone}
                        onChange={(event) =>
                          setNewAddress((prev) => ({ ...prev, phone: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="address-pincode">Pincode</Label>
                      <Input
                        id="address-pincode"
                        required
                        value={newAddress.pincode}
                        onChange={(event) =>
                          setNewAddress((prev) => ({ ...prev, pincode: event.target.value }))
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address-line1">Address line 1</Label>
                      <Input
                        id="address-line1"
                        required
                        value={newAddress.line1}
                        onChange={(event) =>
                          setNewAddress((prev) => ({ ...prev, line1: event.target.value }))
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address-line2">Address line 2</Label>
                      <Input
                        id="address-line2"
                        value={newAddress.line2}
                        onChange={(event) =>
                          setNewAddress((prev) => ({ ...prev, line2: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="address-city">City</Label>
                      <Input
                        id="address-city"
                        required
                        value={newAddress.city}
                        onChange={(event) =>
                          setNewAddress((prev) => ({ ...prev, city: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="address-state">State</Label>
                      <Input
                        id="address-state"
                        required
                        value={newAddress.state}
                        onChange={(event) =>
                          setNewAddress((prev) => ({ ...prev, state: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
                  >
                    Save address
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {loadingAddresses ? (
            <p className="text-sm text-steel-500">Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-steel-500">No saved addresses yet.</p>
          ) : (
            <div className="grid gap-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`cursor-pointer border p-3 ${
                    selectedAddressId === address.id
                      ? "border-safety-orange bg-safety-orange/10"
                      : "border-steel-500/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{address.fullName}</p>
                      <p className="text-sm text-steel-500">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} -{" "}
                        {address.pincode}
                      </p>
                      <p className="text-xs text-steel-500">{address.phone}</p>
                    </div>
                    {address.isDefault ? <Badge>Default</Badge> : null}
                  </div>
                  <input
                    type="radio"
                    name="address"
                    className="sr-only"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                  />
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              onClick={() => goToStep(2)}
              disabled={!selectedAddressId}
              className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
            >
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4 border border-steel-500/25 bg-alloy-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Review</h2>
            <Button variant="ghost" size="sm" className="rounded-none" onClick={() => goToStep(1)}>
              Edit address
            </Button>
          </div>
          {selectedAddress ? (
            <div className="border border-steel-500/25 p-3 text-sm text-steel-500">
              <p className="font-medium text-iron-800">{selectedAddress.fullName}</p>
              <p>
                {selectedAddress.line1}
                {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}
              </p>
              <p>
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </p>
              <p>{selectedAddress.phone}</p>
            </div>
          ) : null}
          <div className="overflow-x-auto border border-steel-500/25">
            <table className="min-w-full text-sm">
              <thead className="bg-iron-800 text-left text-alloy-white">
                <tr>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Unit</th>
                  <th className="px-3 py-2 text-right font-medium">Line total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id ?? item.productId} className="border-t">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="relative h-10 w-10 overflow-hidden border border-steel-500/25">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="40px" />
                        </div>
                        <span className="line-clamp-1">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">
                      <Price valueInPaise={item.priceInPaise} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Price valueInPaise={item.priceInPaise * item.quantity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-steel-500">Subtotal</span>
              <Price valueInPaise={subtotalInPaise} />
            </div>
            <div className="flex justify-between">
              <span className="text-steel-500">Shipping</span>
              <span>Free shipping</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <Price valueInPaise={totalInPaise} />
            </div>
          </div>
          <div>
            <Label htmlFor="order-notes">Notes (optional)</Label>
            <Textarea
              id="order-notes"
              placeholder="Delivery notes, landmark..."
              className="rounded-none border-steel-500/30 bg-alloy-white"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => goToStep(3)}
              disabled={!selectedAddressId || items.length === 0}
              className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
            >
              Continue to payment
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4 border border-steel-500/25 bg-alloy-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Payment</h2>
            {checkout?.provider === "simulator" ? (
              <Badge className="bg-yellow-100 text-yellow-800">Test mode</Badge>
            ) : null}
          </div>
          {creatingOrder ? <p className="text-sm text-steel-500">Creating your order...</p> : null}
          {checkout ? (
            <LazyPaymentWidget
              key={`${checkout.orderNumber}-${paymentRetryKey}`}
              orderNumber={checkout.orderNumber}
              onSuccess={(orderNumber) => router.push(`/order/confirmation/${orderNumber}`)}
              onFailure={(reason) => {
                setError(reason);
                toast(reason);
              }}
            />
          ) : null}
          {checkout ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-none border-forge-950"
              onClick={() => {
                setError(null);
                setPaymentRetryKey((prev) => prev + 1);
              }}
            >
              Retry payment widget
            </Button>
          ) : null}
          <p className="text-xs text-steel-500">
            If you go back now, the pending order remains visible to support and admin teams.
          </p>
          <Link href="/cart" className="text-sm text-steel-500 underline-offset-4 hover:underline">
            Cancel and go back to cart
          </Link>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container py-10 text-sm text-steel-600">Preparing checkout...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
