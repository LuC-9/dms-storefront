"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ExternalLink, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderTimeline } from "@/components/admin/order-timeline";
import { Price } from "@/components/storefront/price";

type TrackPayload = {
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  totalInPaise: number;
  createdAt: string;
  trackingUrl?: string | null;
  shipping: {
    city: string;
    state: string;
  };
  timeline: {
    confirmedAt?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
  };
  items: Array<{ id: string; quantity: number }>;
};

export function PublicTrackOrder({
  orderNumber,
  initialEmail = "",
  signedIn = false,
}: {
  orderNumber: string;
  initialEmail?: string;
  signedIn?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [data, setData] = useState<TrackPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4 border border-steel-500/30 bg-alloy-white p-4 md:p-6">
      <div className="border-b border-steel-300/80 pb-3">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-steel-500">Courier lookup</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-[0.08em]">{orderNumber}</h1>
        <p className="mt-1 text-sm text-steel-500">Enter the order email to view shipping progress.</p>
      </div>
      {signedIn ? (
        <p className="text-xs text-steel-500">
          Signed in as {initialEmail}. For full details, use{" "}
          <Link href={`/account/orders/${orderNumber}`} className="font-medium text-iron-800 hover:underline">
            account order view
          </Link>
          .
        </p>
      ) : null}

      <form
        className="space-y-2 border border-steel-200 bg-blueprint-100/40 p-3"
        onSubmit={async (event: FormEvent) => {
          event.preventDefault();
          if (!email.trim()) {
            setError("Email is required.");
            return;
          }

          setLoading(true);
          setError(null);
          try {
            const response = await fetch(
              `/api/track/${orderNumber}?email=${encodeURIComponent(email.trim().toLowerCase())}`,
              {
                cache: "no-store",
              },
            );
            const json = (await response.json()) as TrackPayload & { error?: { message?: string } };
            if (!response.ok) {
              setData(null);
              setError(json.error?.message ?? "Order not found.");
              return;
            }
            setData(json);
          } finally {
            setLoading(false);
          }
        }}
      >
        <Label htmlFor="tracking-email">Email</Label>
        <div className="flex gap-2">
          <Input
            id="tracking-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="rounded-none border-steel-500/30 bg-alloy-white"
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
          >
            {loading ? "Checking..." : "Track"}
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {data ? (
        <div className="space-y-4 border border-steel-500/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="border border-steel-500 bg-blueprint-100 px-2 py-1 font-mono text-xs uppercase tracking-[0.05em] text-iron-800">
              {data.status}
            </span>
            <Price valueInPaise={data.totalInPaise} />
          </div>
          {(data.status === "SHIPPED" || data.status === "DELIVERED") && (
            <div className="rounded-md border border-safety-orange/50 bg-safety-orange/10 p-3">
              {data.trackingUrl ? (
                <Button asChild className="border border-safety-orange bg-safety-orange text-alloy-white hover:bg-safety-orange/90">
                  <a href={data.trackingUrl} target="_blank" rel="noopener noreferrer">
                    <Truck className="mr-2 h-4 w-4" />
                    Track shipment
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <p className="text-sm font-medium text-iron-800">Tracking details will be available soon.</p>
              )}
            </div>
          )}
          <OrderTimeline
            status={data.status}
            createdAt={data.createdAt}
            confirmedAt={data.timeline.confirmedAt}
            shippedAt={data.timeline.shippedAt}
            deliveredAt={data.timeline.deliveredAt}
            cancelledAt={data.timeline.cancelledAt}
          />
          <p className="text-sm text-steel-500">{data.items.length} item(s)</p>
        </div>
      ) : null}
    </div>
  );
}
