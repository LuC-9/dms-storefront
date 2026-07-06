"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "@/components/ui/toast";

type WishlistRemoveButtonProps = {
  productId: string;
};

export function WishlistRemoveButton({ productId }: WishlistRemoveButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wishlist/items/${productId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Removed from wishlist" });
        router.refresh();
      } else {
        toast({ title: "Could not remove item" });
      }
    } catch {
      toast({ title: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void handleRemove()}
      className="inline-flex items-center gap-1 border border-steel-500/30 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.06em] text-steel-500 hover:border-red-400 hover:text-red-500 disabled:opacity-50"
    >
      <X className="h-3 w-3" />
      {loading ? "Removing..." : "Remove"}
    </button>
  );
}
