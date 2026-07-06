"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type ReorderButtonProps = {
  orderNumber: string;
  size?: "default" | "sm";
};

type ReorderResponse = {
  added: number;
  skipped: string[];
};

export function ReorderButton({ orderNumber, size = "default" }: ReorderButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleReorder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/account/reorder/${orderNumber}`, { method: "POST" });
      if (!res.ok) {
        toast({ title: "Could not reorder", description: "Please try again." });
        return;
      }
      const { added, skipped } = (await res.json()) as ReorderResponse;
      window.dispatchEvent(new CustomEvent("cart:item-added"));

      if (skipped.length > 0) {
        toast({
          title: `Added ${added} item${added !== 1 ? "s" : ""} to cart`,
          description: `Skipped: ${skipped.join(", ")}`,
        });
      } else {
        toast({ title: `${added} item${added !== 1 ? "s" : ""} added to cart` });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  if (size === "sm") {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleReorder()}
        className="inline-flex items-center gap-1 border border-steel-500/40 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.06em] text-steel-500 hover:border-safety-orange hover:text-safety-orange disabled:opacity-50"
      >
        <RefreshCcw className="h-3 w-3" />
        {loading ? "Adding..." : "Reorder"}
      </button>
    );
  }

  return (
    <Button
      type="button"
      disabled={loading}
      variant="outline"
      onClick={() => void handleReorder()}
      className="rounded-none border-forge-950 font-display text-sm font-semibold uppercase tracking-[0.05em] hover:border-safety-orange hover:text-safety-orange"
    >
      <RefreshCcw className="mr-2 h-4 w-4" />
      {loading ? "Adding to cart..." : "Reorder"}
    </Button>
  );
}
