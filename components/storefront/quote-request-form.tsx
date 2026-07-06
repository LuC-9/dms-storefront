"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type QuoteRequestFormProps = {
  productId: string;
  initialQuantity?: number;
};

type FormState = "idle" | "loading" | "success" | "error";

export function QuoteRequestForm({ productId, initialQuantity = 1 }: QuoteRequestFormProps) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [quantity, setQuantity] = useState(initialQuantity);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("loading");
    setErrorMsg("");

    try {
      const body: Record<string, unknown> = {
        productId,
        quantity,
        notes: notes.trim() || undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      };
      if (!isLoggedIn) {
        body.guestName = guestName.trim() || undefined;
        body.guestEmail = guestEmail.trim() || undefined;
        body.guestPhone = guestPhone.trim() || undefined;
      }

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(data?.error?.message ?? `Request failed (${res.status})`);
      }

      setFormState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setFormState("error");
    }
  }

  return (
    <div className="border border-steel-500/25 bg-alloy-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 font-display text-sm font-semibold uppercase tracking-[0.05em] text-iron-800 hover:bg-blueprint-100 transition-colors"
      >
        Request Quote
        {open ? (
          <ChevronUp className="h-4 w-4 text-steel-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-steel-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-steel-500/25 px-4 pb-4 pt-3">
          {formState === "success" ? (
            <div className="flex items-start gap-3 bg-blueprint-100 border border-steel-500/25 px-4 py-3">
              <span className="mt-0.5 text-safety-orange font-mono text-sm">✓</span>
              <p className="text-sm text-iron-800">
                Quote request submitted. Our team will respond within 1 business day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-mono text-xs uppercase tracking-[0.05em] text-steel-500">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full border border-steel-500/40 bg-white px-3 py-2 font-mono text-sm tracking-[0.03em] text-iron-800 focus:border-iron-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-xs uppercase tracking-[0.05em] text-steel-500">
                    Required by
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full border border-steel-500/40 bg-white px-3 py-2 font-mono text-sm tracking-[0.03em] text-iron-800 focus:border-iron-800 focus:outline-none"
                  />
                </div>
              </div>

              {!isLoggedIn && (
                <>
                  <div>
                    <label className="mb-1 block font-mono text-xs uppercase tracking-[0.05em] text-steel-500">
                      Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full border border-steel-500/40 bg-white px-3 py-2 text-sm text-iron-800 focus:border-iron-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-xs uppercase tracking-[0.05em] text-steel-500">
                      Email
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full border border-steel-500/40 bg-white px-3 py-2 text-sm text-iron-800 focus:border-iron-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-xs uppercase tracking-[0.05em] text-steel-500">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full border border-steel-500/40 bg-white px-3 py-2 text-sm text-iron-800 focus:border-iron-800 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-[0.05em] text-steel-500">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Specifications, delivery location, special requirements…"
                  className="w-full border border-steel-500/40 bg-white px-3 py-2 text-sm text-iron-800 focus:border-iron-800 focus:outline-none resize-none"
                />
              </div>

              {formState === "error" && (
                <p className="font-mono text-xs text-safety-orange">{errorMsg}</p>
              )}

              <Button
                type="submit"
                disabled={formState === "loading"}
                className="w-full border border-iron-800 bg-iron-800 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white hover:bg-forge-950 rounded-none"
              >
                {formState === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Quote Request"
                )}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
