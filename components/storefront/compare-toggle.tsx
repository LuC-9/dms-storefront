"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "delta-compare";
const MAX_ITEMS = 4;
const COMPARE_EVENT = "delta:compare-updated";

export type CompareProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  priceInPaise: number;
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

// ─── Toggle Checkbox ─────────────────────────────────────────────────────────

type CompareToggleProps = {
  product: CompareProduct;
};

export function CompareToggle({ product }: CompareToggleProps) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const sync = () => setChecked(readList().some((p) => p.id === product.id));
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [product.id]);

  const toggle = () => {
    const list = readList();
    if (checked) {
      writeList(list.filter((p) => p.id !== product.id));
    } else {
      if (list.length >= MAX_ITEMS) {
        alert(`You can compare up to ${MAX_ITEMS} products at once.`);
        return;
      }
      writeList([...list, product]);
    }
  };

  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-steel-500 hover:text-iron-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        className="h-3.5 w-3.5 accent-safety-orange"
      />
      Compare
    </label>
  );
}

// ─── Floating Bar ─────────────────────────────────────────────────────────────

export function CompareBar() {
  const [list, setList] = useState<CompareProduct[]>([]);

  useEffect(() => {
    const sync = () => setList(readList());
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const visible = list.length >= 2;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="compare-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="fixed bottom-16 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-forge-950 px-4 py-3 shadow-2xl md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:px-6"
          style={{ minWidth: "min(480px, 100vw)" }}
        >
          <span className="font-mono text-sm text-alloy-white">
            <span className="font-bold text-safety-orange">{list.length}</span> items selected
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => writeList([])}
              className="font-mono text-xs text-steel-500 underline-offset-2 hover:text-alloy-white hover:underline"
            >
              Clear
            </button>
            <Link
              href="/compare"
              className="border border-safety-orange bg-safety-orange px-4 py-1.5 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
            >
              View comparison
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
