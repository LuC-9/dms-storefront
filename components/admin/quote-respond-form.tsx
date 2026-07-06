"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

type QuoteRespondStatus = "QUOTED" | "ACCEPTED" | "REJECTED" | "EXPIRED";

type Props = {
  quoteId: string;
  currentStatus: string;
};

export function QuoteRespondForm({ quoteId, currentStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<QuoteRespondStatus>("QUOTED");
  const [quotedPriceRupees, setQuotedPriceRupees] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary hover:underline"
      >
        Respond
      </button>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const body: {
      status: QuoteRespondStatus;
      quotedPrice?: number;
      adminNotes?: string;
    } = { status };

    if (quotedPriceRupees.trim() !== "") {
      const rupees = parseFloat(quotedPriceRupees);
      if (!Number.isFinite(rupees) || rupees <= 0) {
        setError("Quoted price must be a positive number");
        setSubmitting(false);
        return;
      }
      body.quotedPrice = Math.round(rupees * 100);
    }

    if (adminNotes.trim() !== "") {
      body.adminNotes = adminNotes.trim();
    }

    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(data?.error?.message ?? "Failed to update quote");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p className="text-xs font-medium text-green-700">
        Updated successfully.{" "}
        <button type="button" onClick={() => { setSuccess(false); setOpen(false); }} className="underline">
          Close
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-3 rounded-md border border-steel-200 bg-steel-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-steel-600">Respond to Quote</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-steel-500 hover:text-steel-700"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`status-${quoteId}`} className="text-xs">Status</Label>
          <Select
            id={`status-${quoteId}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as QuoteRespondStatus)}
            required
          >
            <option value="QUOTED">Quoted</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`price-${quoteId}`} className="text-xs">Quoted Price (₹) — optional</Label>
          <Input
            id={`price-${quoteId}`}
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 1500.00"
            value={quotedPriceRupees}
            onChange={(e) => setQuotedPriceRupees(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`notes-${quoteId}`} className="text-xs">Admin Notes — optional</Label>
        <Textarea
          id={`notes-${quoteId}`}
          placeholder="Add internal or customer-facing notes…"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          className="min-h-[72px] text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? "Saving…" : "Save Response"}
      </Button>
    </form>
  );
}
