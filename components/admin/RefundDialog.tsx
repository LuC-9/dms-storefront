"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatInr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

type RefundType = "FULL" | "PARTIAL";

function paiseToRupeesString(valueInPaise: number) {
  return (valueInPaise / 100).toFixed(2);
}

function rupeesStringToPaise(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return NaN;
  return Math.round(numeric * 100);
}

export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  remainingRefundableInPaise,
  defaultType = "FULL",
  defaultCancelOrder = true,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  remainingRefundableInPaise: number;
  defaultType?: RefundType;
  defaultCancelOrder?: boolean;
  onSuccess?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const [type, setType] = useState<RefundType>(defaultType);
  const [amountInRupees, setAmountInRupees] = useState(paiseToRupeesString(remainingRefundableInPaise));
  const [reason, setReason] = useState("");
  const [cancelOrder, setCancelOrder] = useState(defaultCancelOrder);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setCancelOrder(defaultCancelOrder);
    setAmountInRupees(paiseToRupeesString(remainingRefundableInPaise));
    setReason("");
  }, [defaultCancelOrder, defaultType, open, remainingRefundableInPaise]);

  const amountInPaise = useMemo(() => {
    if (type === "FULL") return remainingRefundableInPaise;
    return rupeesStringToPaise(amountInRupees);
  }, [amountInRupees, remainingRefundableInPaise, type]);

  const submit = async () => {
    if (!reason.trim()) {
      toast("Refund reason is required");
      return;
    }

    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      toast("Refund amount must be greater than zero");
      return;
    }

    if (amountInPaise > remainingRefundableInPaise) {
      toast("Refund amount exceeds remaining refundable amount");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amountInPaise,
          reason: reason.trim(),
          cancelOrder,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!response.ok) {
        toast(payload?.error?.message ?? "Unable to issue refund");
        return;
      }

      toast({
        title: "Refund created",
        description: "Refund request has been recorded and is pending processing.",
      });
      onOpenChange(false);
      await onSuccess?.();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue refund</DialogTitle>
          <DialogDescription>
            Remaining refundable: <span className="font-medium">{formatInr(remainingRefundableInPaise)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Refund type</Label>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="refund-type"
                  checked={type === "FULL"}
                  onChange={() => {
                    setType("FULL");
                    setCancelOrder(true);
                  }}
                />
                Full
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="refund-type"
                  checked={type === "PARTIAL"}
                  onChange={() => {
                    setType("PARTIAL");
                    setCancelOrder(false);
                  }}
                />
                Partial
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-amount">Amount (INR)</Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              min="0"
              value={type === "FULL" ? paiseToRupeesString(remainingRefundableInPaise) : amountInRupees}
              onChange={(event) => setAmountInRupees(event.target.value)}
              disabled={type === "FULL"}
            />
            <p className="text-xs text-steel-500">Submitted in paise. Max allowed: {formatInr(remainingRefundableInPaise)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this refund being issued?"
              maxLength={1000}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cancelOrder} onChange={(event) => setCancelOrder(event.target.checked)} />
            Cancel order?
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Close
          </Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit refund"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
