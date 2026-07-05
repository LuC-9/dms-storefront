"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

const REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery time too long",
  "Other",
] as const;

export function CancelOrderDialog({
  orderNumber,
  onSuccess,
}: {
  orderNumber: string;
  onSuccess?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reasonOption, setReasonOption] = useState<(typeof REASONS)[number]>("Changed my mind");
  const [otherReason, setOtherReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reason = useMemo(() => {
    if (reasonOption !== "Other") return reasonOption;
    const details = otherReason.trim();
    return details ? `Other: ${details}` : "Other";
  }, [otherReason, reasonOption]);

  const submit = async () => {
    if (reasonOption === "Other" && !otherReason.trim()) {
      toast("Please provide a reason");
      return;
    }
    if (reason.length > 500) {
      toast("Reason is too long");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderNumber}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        toast(payload?.error?.message ?? "Unable to cancel order");
        return;
      }

      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled. Refund will be processed within 5-7 business days.",
      });
      setOpen(false);
      setOtherReason("");
      setReasonOption("Changed my mind");
      await onSuccess?.();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-none border border-safety-orange text-safety-orange hover:bg-blueprint-100">
          Cancel order
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>Select a reason so we can process your cancellation faster.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {REASONS.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="cancel-reason"
                value={option}
                checked={reasonOption === option}
                onChange={() => setReasonOption(option)}
              />
              <span className="text-sm font-medium leading-none text-steel-800">{option}</span>
            </label>
          ))}

          {reasonOption === "Other" ? (
            <div className="space-y-2">
              <Label htmlFor="cancel-other-reason">Tell us more</Label>
              <Textarea
                id="cancel-other-reason"
                placeholder="Enter your cancellation reason"
                value={otherReason}
                onChange={(event) => setOtherReason(event.target.value)}
                maxLength={500}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Keep order
          </Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Cancelling..." : "Confirm cancellation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
