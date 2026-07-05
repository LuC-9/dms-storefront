"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const filters = [
  { value: "all", label: "All parts" },
  { value: "available", label: "Available only" },
  { value: "unavailable", label: "Out of stock" },
];

export function CategoryFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = useMemo(() => searchParams.get("stock") ?? "all", [searchParams]);

  const setFilter = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      next.delete("stock");
    } else {
      next.set("stock", value);
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <>
      <aside className="hidden border border-steel-500/25 bg-alloy-white p-4 md:block">
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Filters</h2>
        <div className="mt-4 space-y-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setFilter(filter.value)}
              className={`block w-full border px-3 py-2 text-left text-sm ${
                selected === filter.value
                  ? "border-safety-orange bg-safety-orange text-alloy-white"
                  : "border-steel-500/25 bg-alloy-white text-iron-800"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </aside>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-none border-forge-950 bg-alloy-white text-forge-950">
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="border-steel-500 bg-alloy-white">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Filters</h2>
            <div className="mt-4 space-y-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setFilter(filter.value)}
                  className={`block w-full border px-3 py-2 text-left text-sm ${
                    selected === filter.value
                      ? "border-safety-orange bg-safety-orange text-alloy-white"
                      : "border-steel-500/25 bg-alloy-white text-iron-800"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
