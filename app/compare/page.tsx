"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/storefront/price";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import type { CompareProduct } from "@/components/storefront/compare-toggle";

const STORAGE_KEY = "delta-compare";
const COMPARE_EVENT = "delta:compare-updated";

type ProductDetail = CompareProduct & {
  description: string;
  sku: string | null;
  inStock: boolean;
};

function readList(): CompareProduct[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CompareProduct[];
  } catch {
    return [];
  }
}

function writeList(list: CompareProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(COMPARE_EVENT));
}

export default function ComparePage() {
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    const stored = readList();
    if (stored.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const results = await Promise.all(
      stored.map(async (p) => {
        try {
          const res = await fetch(`/api/products/${p.slug}`, { cache: "no-store" });
          if (!res.ok) return { ...p, description: "", sku: null, inStock: false };
          const data = (await res.json()) as ProductDetail;
          return data;
        } catch {
          return { ...p, description: "", sku: null, inStock: false };
        }
      }),
    );
    setProducts(results);
    setLoading(false);
  };

  useEffect(() => {
    void loadProducts();
    const sync = () => void loadProducts();
    window.addEventListener(COMPARE_EVENT, sync);
    return () => window.removeEventListener(COMPARE_EVENT, sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeProduct = (id: string) => {
    const updated = readList().filter((p) => p.id !== id);
    writeList(updated);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAll = () => {
    writeList([]);
    setProducts([]);
  };

  const rows: Array<{ label: string; render: (p: ProductDetail) => React.ReactNode }> = [
    {
      label: "Image",
      render: (p) => (
        <div className="relative h-32 overflow-hidden bg-blueprint-100">
          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
        </div>
      ),
    },
    { label: "Name", render: (p) => <span className="font-display text-base font-semibold">{p.name}</span> },
    { label: "Price", render: (p) => <Price valueInPaise={p.priceInPaise} className="text-base font-bold" /> },
    { label: "SKU", render: (p) => <span className="font-mono text-sm text-steel-500">{p.sku ?? "—"}</span> },
    {
      label: "In Stock",
      render: (p) =>
        p.inStock ? (
          <span className="font-mono text-xs uppercase text-safety-orange">In stock</span>
        ) : (
          <span className="font-mono text-xs uppercase text-steel-500">Enquire</span>
        ),
    },
    {
      label: "Description",
      render: (p) => (
        <p className="line-clamp-3 text-sm text-steel-600">{p.description || "—"}</p>
      ),
    },
    {
      label: "Action",
      render: (p) => (
        <AddToCartButton
          product={{ id: p.id, name: p.name, slug: p.slug, imageUrl: p.imageUrl, priceInPaise: p.priceInPaise, inStock: p.inStock }}
        />
      ),
    },
  ];

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-steel-500">Delta Mills Store</p>
          <h1 className="font-display text-4xl font-bold uppercase tracking-[0.05em] text-iron-800">
            Compare Products
          </h1>
        </div>
        {products.length > 0 && (
          <Button
            variant="outline"
            className="rounded-none border-forge-950 font-mono text-xs uppercase"
            onClick={clearAll}
          >
            Clear all
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-steel-500">Loading...</p>
      ) : products.length < 2 ? (
        <div className="border border-steel-500/30 bg-alloy-white p-8 text-center">
          <p className="font-display text-xl font-semibold text-iron-800">Add at least 2 products to compare</p>
          <p className="mt-2 text-sm text-steel-500">
            Use the Compare checkbox on product cards to build your comparison list.
          </p>
          <Link
            href="/catalogue"
            className="mt-4 inline-block border border-safety-orange bg-safety-orange px-5 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
          >
            Browse catalogue
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-32 border-b border-steel-500/25 bg-blueprint-100/60 px-4 py-3 text-left font-display text-sm font-semibold uppercase tracking-[0.05em] text-iron-800">
                  Feature
                </th>
                {products.map((p) => (
                  <th key={p.id} className="border-b border-l border-steel-500/25 bg-blueprint-100/60 px-4 py-3 text-left">
                    <button
                      type="button"
                      aria-label="Remove from comparison"
                      onClick={() => removeProduct(p.id)}
                      className="float-right ml-2 text-steel-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <span className="font-display text-sm font-bold uppercase tracking-[0.04em] text-iron-800">
                      {p.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="even:bg-blueprint-100/20 odd:bg-alloy-white">
                  <td className="border-b border-steel-500/15 px-4 py-3 font-mono text-xs uppercase tracking-[0.06em] text-steel-500">
                    {row.label}
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="border-b border-l border-steel-500/15 px-4 py-3">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
