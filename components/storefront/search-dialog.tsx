"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInr } from "@/lib/utils";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  priceInPaise: number;
  imageUrl: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export function SearchDialog() {
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
    if (!open) {
      return;
    }

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
        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data: SearchResult[] = await response.json();
        setResults(data);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const groupedResults = useMemo(() => {
    return results.reduce<Record<string, SearchResult[]>>((groups, item) => {
      const categoryName = item.category?.name ?? "Uncategorized";
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
      return groups;
    }, {});
  }, [results]);
  const groupedResultEntries = useMemo(
    () => Object.entries(groupedResults) as Array<[string, SearchResult[]]>,
    [groupedResults],
  );

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

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 rounded-none border border-steel-500/40 px-2 text-alloy-white hover:bg-forge-950"
        onClick={() => setOpen(true)}
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden text-[10px] uppercase tracking-[0.08em] text-steel-300 sm:inline">Ctrl/Cmd+K</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[600px] border-steel-300 bg-alloy-white p-0">
          <div className="border-b border-steel-200 p-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-steel-500" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products by name or description"
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-steel-500" /> : null}
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-3">
            {!hasQuery ? (
              <p className="py-8 text-center text-sm text-steel-500">Start typing to search products.</p>
            ) : loading ? (
              <p className="py-8 text-center text-sm text-steel-500">Searching products...</p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-steel-500">No results found.</p>
            ) : (
              <div className="space-y-4">
                {groupedResultEntries.map(([categoryName, items]) => (
                  <div key={categoryName} className="space-y-2">
                    <p className="px-2 text-xs font-medium uppercase tracking-[0.07em] text-steel-500">
                      {categoryName}
                    </p>
                    <div className="space-y-1">
                      {items.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelect(product.slug)}
                          className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-blueprint-100"
                        >
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 rounded-sm border border-steel-200 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-iron-800">{product.name}</p>
                            <p className="truncate text-xs text-steel-500">{product.category?.name ?? "Uncategorized"}</p>
                          </div>
                          <p className="text-xs font-medium text-iron-800">{formatInr(product.priceInPaise)}</p>
                        </button>
                      ))}
                    </div>
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
