"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatInr } from "@/lib/utils";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  priceInPaise: number;
  imageUrl: string;
  category?: { id: string; name: string; slug: string } | null;
};

type SearchDialogProps = {
  variant?: "default" | "header" | "icon";
};

export function SearchDialog({ variant = "default" }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      return;
    }
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        setResults(await response.json());
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const groupedResultEntries = useMemo(() => {
    const groups = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
      const key = item.category?.name ?? "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    return Object.entries(groups) as Array<[string, SearchResult[]]>;
  }, [results]);

  const hasQuery = query.trim().length > 0;

  const handleSelect = useCallback(
    (slug: string) => {
      setOpen(false);
      setQuery("");
      setResults([]);
      router.push(`/products/${slug}`);
    },
    [router],
  );

  const trigger =
    variant === "header" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-[320px] items-center gap-2 rounded-full bg-white/10 px-3 text-left shadow-inner ring-1 ring-white/10 transition-all hover:bg-white/15"
        aria-label="Search products"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-white/50" />
        <span className="min-w-0 flex-1 truncate whitespace-nowrap text-xs leading-none text-white/50">
          Search hardware, categories, or SKU…
        </span>
        <kbd className="hidden shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/60 lg:inline">
          ⌘K
        </kbd>
      </button>
    ) : variant === "icon" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/15 hover:bg-white/20"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
      </button>
    );

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[480px] overflow-hidden rounded-3xl border border-steel-200 bg-alloy-white p-0 shadow-2xl [&>button]:right-3 [&>button]:top-3 [&>button]:rounded-full [&>button]:bg-white/10 [&>button]:text-white [&>button:hover]:bg-white/20">
          <div className="bg-iron-800 p-3 pr-12">
            <div className="flex h-11 items-center gap-3 rounded-full bg-white px-3 shadow-inner ring-1 ring-white/20">
              <Search className="h-4 w-4 shrink-0 text-safety-orange" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search valves, fittings, SKU..."
                className="h-9 border-0 bg-transparent px-0 font-sans text-sm shadow-none placeholder:text-steel-400 focus-visible:ring-0"
              />
              {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-steel-400" />}
            </div>
          </div>
          <div
            className={cn(
              "overflow-y-auto bg-white",
              hasQuery && results.length > 0 ? "max-h-[min(300px,45vh)] p-3" : "p-4",
            )}
          >
            {!hasQuery ? (
              <div className="rounded-2xl border border-dashed border-steel-200 bg-surface-muted/70 px-4 py-6 text-center">
                <p className="font-display text-sm font-bold text-iron-800">Find industrial stock fast</p>
                <p className="mt-1 text-xs text-steel-500">Try valves, bearings, pipes, motors, or product SKU.</p>
              </div>
            ) : loading ? (
              <p className="rounded-2xl bg-surface-muted px-4 py-6 text-center text-sm text-steel-500">Searching stock...</p>
            ) : results.length === 0 ? (
              <div className="rounded-2xl bg-surface-muted px-4 py-6 text-center">
                <p className="text-sm font-bold text-iron-800">No matching products</p>
                <p className="mt-1 text-xs text-steel-500">Try a category name or shorter keyword.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedResultEntries.map(([categoryName, items]) => (
                  <div key={categoryName} className="space-y-1.5">
                    <p className="px-2 pt-1 font-sans text-xs font-semibold text-safety-orange">{categoryName}</p>
                    {items.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelect(product.slug)}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-2.5 py-2 text-left transition-all hover:border-steel-100 hover:bg-surface-muted shadow-sm hover:shadow"
                      >
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-xl border border-steel-100 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-iron-800 group-hover:text-safety-orange">{product.name}</p>
                          <p className="truncate font-sans text-xs text-steel-500">{product.category?.name}</p>
                        </div>
                        <p className="shrink-0 font-sans text-sm font-bold text-iron-800">{formatInr(product.priceInPaise)}</p>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
