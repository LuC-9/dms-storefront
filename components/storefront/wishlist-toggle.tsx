"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

type WishlistToggleProps = {
  productId: string;
};

export function WishlistToggle({ productId }: WishlistToggleProps) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && session?.user?.userType === "customer";

  const [inWishlist, setInWishlist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    void fetch("/api/wishlist", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { items?: Array<{ productId: string }> }) => {
        setInWishlist(data.items?.some((i) => i.productId === productId) ?? false);
      })
      .catch(() => {/* silently ignore */});
  }, [isLoggedIn, productId]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const handleClick = async () => {
    if (!isLoggedIn) {
      setShowHint(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setShowHint(false), 2500);
      return;
    }

    const previous = inWishlist;
    setInWishlist(!previous);
    setBusy(true);

    try {
      if (previous) {
        const res = await fetch(`/api/wishlist/items/${productId}`, { method: "DELETE" });
        if (!res.ok) setInWishlist(previous);
      } else {
        const res = await fetch("/api/wishlist/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok && res.status !== 409) setInWishlist(previous);
      }
    } catch {
      setInWishlist(previous);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
        disabled={busy}
        onClick={() => void handleClick()}
        className="flex h-8 w-8 items-center justify-center bg-forge-950/70 text-alloy-white backdrop-blur-sm transition-colors hover:bg-forge-950/90 disabled:opacity-50"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            inWishlist ? "fill-current text-safety-orange" : "text-alloy-white"
          }`}
        />
      </button>
      {showHint && (
        <span className="absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap bg-forge-950 px-2 py-1 font-mono text-[0.6rem] text-alloy-white shadow-lg">
          Sign in to save items
        </span>
      )}
    </div>
  );
}
