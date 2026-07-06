"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/admin/order-timeline";
import { Price } from "@/components/storefront/price";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { RefundStatusSection } from "@/components/orders/RefundStatusSection";
import { ReorderButton } from "@/components/storefront/reorder-button";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  subtotalInPaise: number;
  shippingInPaise: number;
  taxInPaise: number;
  totalInPaise: number;
  createdAt: string;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  trackingUrl?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  notes?: string | null;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    id: string;
    productNameSnapshot: string;
    productSlugSnapshot: string;
    quantity: number;
    lineTotalInPaise: number;
    unitPriceInPaise: number;
  }>;
};

export default function AccountOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const orderNumber = params.orderNumber;

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderNumber}`, { cache: "no-store" });
      if (!response.ok) {
        setOrder(null);
        return;
      }
      const json = (await response.json()) as OrderDetail;
      setOrder(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  if (loading) {
    return <div className="border border-steel-500/25 bg-alloy-white p-4 text-sm text-steel-500">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="rounded-lg border border-steel-200 p-4">
        <p className="text-sm text-steel-500">Order not found.</p>
        <Button asChild variant="outline" className="mt-3 rounded-none border-forge-950">
          <Link href="/account/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 border border-steel-500/30 bg-alloy-white p-4 md:p-6">
      <div className="border-b border-steel-300/80 pb-4">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-steel-500">Delta Mill Store dispatch note</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-[0.08em] md:text-4xl">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-steel-500">Placed on {new Date(order.createdAt).toLocaleString("en-IN")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-steel-500 bg-blueprint-100 px-2 py-1 font-mono text-xs uppercase tracking-[0.03em] text-iron-800">
              {order.status}
            </span>
            <span className="border border-steel-500/30 px-2 py-1 font-mono text-xs uppercase tracking-[0.03em] text-steel-500">
              {order.paymentStatus}
            </span>
            <Link
              href={`/orders/${order.orderNumber}/invoice`}
              className="border border-steel-500/40 px-2 py-1 font-mono text-xs uppercase tracking-[0.03em] text-steel-500 hover:border-iron-800 hover:text-iron-800"
            >
              Download Invoice
            </Link>
            <ReorderButton orderNumber={order.orderNumber} />
          </div>
        </div>
        {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
          <div className="mt-4 rounded-md border border-safety-orange/50 bg-safety-orange/10 p-3">
            {order.trackingUrl ? (
              <Button asChild className="w-full border border-safety-orange bg-safety-orange text-alloy-white hover:bg-safety-orange/90 md:w-auto">
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
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
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="border border-steel-500/25">
            <div className="border-b border-steel-300/70 bg-blueprint-100/50 px-4 py-3">
              <h2 className="font-display text-xl font-semibold uppercase tracking-[0.08em]">Line items</h2>
              <p className="text-xs text-steel-500">Invoice-style summary of this order.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-iron-800 text-left text-alloy-white">
                  <tr>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Unit</th>
                    <th className="px-3 py-2 text-right font-medium">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-alloy-white" : "bg-steel-50/80"}>
                      <td className="border-t border-steel-200/80 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center border border-steel-300 bg-blueprint-100 font-mono text-xs font-semibold uppercase text-steel-700">
                            {item.productNameSnapshot.slice(0, 2)}
                          </div>
                          <Link href={`/products/${item.productSlugSnapshot}`} className="font-medium hover:underline">
                            {item.productNameSnapshot}
                          </Link>
                        </div>
                      </td>
                      <td className="border-t border-steel-200/80 px-3 py-2">{item.quantity}</td>
                      <td className="border-t border-steel-200/80 px-3 py-2">
                        <Price valueInPaise={item.unitPriceInPaise} />
                      </td>
                      <td className="border-t border-steel-200/80 px-3 py-2 text-right">
                        <Price valueInPaise={item.lineTotalInPaise} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
          <OrderTimeline
            status={order.status}
            createdAt={order.createdAt}
            confirmedAt={order.confirmedAt}
            shippedAt={order.shippedAt}
            deliveredAt={order.deliveredAt}
            cancelledAt={order.cancelledAt}
          />
        </section>
        <section className="space-y-4">
          <div className="border border-steel-500/25 p-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold uppercase tracking-[0.08em]">
              <MapPin className="h-5 w-5 text-safety-orange" />
              Delivery address
            </h2>
            <p className="mt-3 text-sm leading-6 text-steel-600">
              <span className="block font-semibold text-iron-800">{order.shippingAddress.fullName}</span>
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.phone}
            </p>
          </div>
          <div className="border border-steel-500/25 p-4">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.08em]">Payment summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-steel-500">Subtotal</span>
                <Price valueInPaise={order.subtotalInPaise} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-steel-500">Shipping</span>
                <Price valueInPaise={order.shippingInPaise} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-steel-500">Tax</span>
                <Price valueInPaise={order.taxInPaise} />
              </div>
              <div className="border-t border-steel-300/70 pt-2">
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total</span>
                  <Price valueInPaise={order.totalInPaise} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.08em]">
                <span className="text-steel-500">Payment</span>
                <span className="font-semibold text-iron-800">{order.paymentStatus}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <RefundStatusSection orderNumber={order.orderNumber} />

      {["PENDING", "CONFIRMED"].includes(order.status) ? (
        <CancelOrderDialog
          orderNumber={order.orderNumber}
          onSuccess={async () => {
            await loadOrder();
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
