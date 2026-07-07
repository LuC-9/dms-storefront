"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CatalogueFiltersProps = {
  currentParams: {
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
    category?: string;
  };
};

export function CatalogueFilters({ currentParams }: CatalogueFiltersProps) {
  const router = useRouter();
  const [minPrice, setMinPrice] = useState(currentParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(currentParams.maxPrice ?? "");

  function applyPriceFilter() {
    const next: Record<string, string> = {};
    if (currentParams.inStock) next.inStock = currentParams.inStock;
    if (currentParams.category) next.category = currentParams.category;
    if (minPrice.trim()) next.minPrice = minPrice.trim();
    if (maxPrice.trim()) next.maxPrice = maxPrice.trim();
    const qs = new URLSearchParams(next).toString();
    router.push(qs ? `/catalogue?${qs}` : "/catalogue");
  }

  function clearPriceFilter() {
    setMinPrice("");
    setMaxPrice("");
    const next: Record<string, string> = {};
    if (currentParams.inStock) next.inStock = currentParams.inStock;
    if (currentParams.category) next.category = currentParams.category;
    const qs = new URLSearchParams(next).toString();
    router.push(qs ? `/catalogue?${qs}` : "/catalogue");
  }

  const hasPriceFilter = !!currentParams.minPrice || !!currentParams.maxPrice;

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <span className="font-mono text-xs text-steel-500 self-center">Price range (₹):</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-24 rounded-xl border-0 bg-surface-muted px-3 py-2 text-sm ring-1 ring-steel-200 focus:ring-2 focus:ring-safety-orange/30"
          />
          <span className="font-mono text-xs text-steel-500">—</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-24 rounded-xl border-0 bg-surface-muted px-3 py-2 text-sm ring-1 ring-steel-200 focus:ring-2 focus:ring-safety-orange/30"
          />
        </div>
        <button
          type="button"
          onClick={applyPriceFilter}
          className="rounded-full bg-iron-800 px-4 py-2 text-sm font-semibold text-white hover:bg-forge-950 transition-colors"
        >
          Apply
        </button>
        {hasPriceFilter && (
          <button
            type="button"
            onClick={clearPriceFilter}
            className="border border-steel-500/30 bg-white px-3 py-1.5 font-mono text-xs uppercase tracking-[0.05em] text-steel-500 hover:border-iron-800 hover:text-iron-800 transition-colors"
          >
            Clear price
          </button>
        )}
      </div>
    </div>
  );
}
