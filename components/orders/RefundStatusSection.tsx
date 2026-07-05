"use client";

import { useEffect, useState } from "react";
import { formatInr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type RefundItem = {
  id: string;
  amountInPaise: number;
  type: "FULL" | "PARTIAL";
  status: "PENDING" | "PROCESSED" | "FAILED";
  reason: string;
  createdAt: string;
};

type RefundsResponse = {
  refunds: RefundItem[];
  totalRefundedInPaise: number;
  remainingRefundableInPaise: number;
};

function getStatusClass(status: RefundItem["status"]) {
  if (status === "PROCESSED") return "bg-green-100 text-green-700";
  if (status === "FAILED") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

export function RefundStatusSection({ orderNumber }: { orderNumber: string }) {
  const [data, setData] = useState<RefundsResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadRefunds = async () => {
      const response = await fetch(`/api/orders/${orderNumber}/refunds`, { cache: "no-store" });
      if (!response.ok) {
        if (isMounted) setData(null);
        return;
      }
      const payload = (await response.json()) as RefundsResponse;
      if (isMounted) setData(payload);
    };
    void loadRefunds();
    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  if (!data || data.refunds.length === 0) {
    return null;
  }

  return (
    <section className="border border-steel-500/25 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.08em]">Refund status</h2>
        <div className="text-right text-xs text-steel-500">
          <p>Total refunded: {formatInr(data.totalRefundedInPaise)}</p>
          <p>Remaining refundable: {formatInr(data.remainingRefundableInPaise)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-iron-800 text-left text-alloy-white">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.refunds.map((refund, index) => (
              <tr key={refund.id} className={index % 2 === 0 ? "bg-alloy-white" : "bg-steel-50/80"}>
                <td className="border-t border-steel-200/80 px-3 py-2">
                  {new Date(refund.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="border-t border-steel-200/80 px-3 py-2">{formatInr(refund.amountInPaise)}</td>
                <td className="border-t border-steel-200/80 px-3 py-2">{refund.type === "FULL" ? "Full" : "Partial"}</td>
                <td className="border-t border-steel-200/80 px-3 py-2">
                  <Badge className={getStatusClass(refund.status)}>{refund.status}</Badge>
                </td>
                <td className="border-t border-steel-200/80 px-3 py-2">{refund.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
