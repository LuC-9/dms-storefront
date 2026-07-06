"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/storefront/price";
import { ReorderButton } from "@/components/storefront/reorder-button";

type OrderRow = {
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  totalInPaise: number;
  createdAt: string;
  itemCount: number;
};

type OrdersPayload = {
  items: OrderRow[];
  nextCursor: string | null;
};

function renderStatusBadge(status: OrderRow["status"]) {
  const value = status.toUpperCase();
  if (value === "DELIVERED") {
    return (
      <span className="inline-flex border border-iron-800 bg-iron-800 px-2 py-1 font-mono text-xs uppercase tracking-[0.03em] text-alloy-white">
        {value}
      </span>
    );
  }
  if (value === "CANCELLED") {
    return (
      <span className="inline-flex border border-red-600 bg-red-600 px-2 py-1 font-mono text-xs uppercase tracking-[0.03em] text-alloy-white">
        {value}
      </span>
    );
  }
  return (
    <span className="inline-flex border border-blueprint-100 bg-blueprint-100 px-2 py-1 font-mono text-xs uppercase tracking-[0.03em] text-iron-800">
      {value}
    </span>
  );
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (cursor?: string | null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch(`/api/orders?limit=10${cursor ? `&cursor=${cursor}` : ""}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as OrdersPayload;
      setOrders((prev) => (cursor ? [...prev, ...(json.items ?? [])] : json.items ?? []));
      setNextCursor(json.nextCursor ?? null);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="border border-steel-500/25 bg-alloy-white p-4">
      <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Orders</h1>
      <p className="text-sm text-steel-500">Track and manage your purchases.</p>

      {loading ? (
        <p className="mt-4 text-sm text-steel-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="mt-4 border border-steel-500/30 p-6 text-center text-sm text-steel-500">
          No orders yet. Parts you order will appear here.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <article key={order.orderNumber} className="border border-steel-500/25 bg-alloy-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm tracking-[0.03em]">{order.orderNumber}</p>
                  <p className="text-xs text-steel-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                  <p className="text-xs text-steel-500">{order.itemCount} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-steel-500">Total</p>
                  <Price valueInPaise={order.totalInPaise} className="text-base" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {renderStatusBadge(order.status)}
                <span className="font-mono text-xs uppercase tracking-[0.03em] text-steel-500">
                  {order.paymentStatus}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="text-sm text-iron-800 underline-offset-4 hover:underline"
                >
                  View details →
                </Link>
                <ReorderButton orderNumber={order.orderNumber} size="sm" />
              </div>
            </article>
          ))}
        </div>
      )}

      {nextCursor ? (
        <div className="mt-4">
          <Button
            variant="outline"
            className="rounded-none border-forge-950"
            onClick={() => void load(nextCursor)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
