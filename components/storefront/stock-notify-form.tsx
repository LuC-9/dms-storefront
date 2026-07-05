"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

type StockNotifyFormProps = {
  productId: string;
  initialEmail?: string | null;
};

export function StockNotifyForm({ productId, initialEmail }: StockNotifyFormProps) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="space-y-3 rounded-md border border-steel-500/25 bg-alloy-white p-3">
      <Badge className="border border-steel-500/30 bg-blueprint-100 text-xs font-medium text-iron-800">
        Out of stock
      </Badge>
      <form
        className="space-y-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          try {
            const response = await fetch("/api/notifications/stock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId, email }),
            });
            const payload = (await response.json().catch(() => null)) as
              | { message?: string; error?: { message?: string } }
              | null;
            if (!response.ok) {
              toast(payload?.error?.message ?? "Unable to add notification");
              return;
            }
            toast(payload?.message ?? "We'll email you when this is back in stock");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          required
          className="rounded-none"
        />
        <Button
          type="submit"
          disabled={submitting}
          className="w-full rounded-none border border-safety-orange bg-safety-orange font-display text-xs uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
        >
          {submitting ? "Submitting..." : "Notify me when available"}
        </Button>
      </form>
    </div>
  );
}
