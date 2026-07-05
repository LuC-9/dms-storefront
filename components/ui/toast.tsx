"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type ToastInput =
  | string
  | {
      title: string;
      description?: string;
      actionLabel?: string;
      onAction?: () => void;
    };

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastListener = (item: ToastItem) => void;

const listeners = new Set<ToastListener>();

function emitToast(item: ToastItem) {
  listeners.forEach((listener) => listener(item));
}

export function toast(input: ToastInput) {
  const item: ToastItem =
    typeof input === "string"
      ? {
          id: crypto.randomUUID(),
          title: input,
        }
      : {
          id: crypto.randomUUID(),
          title: input.title,
          description: input.description,
          actionLabel: input.actionLabel,
          onAction: input.onAction,
        };

  emitToast(item);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: ToastListener = (item) => {
      setItems((prev) => [...prev, item]);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const timers = items.map((item) =>
      window.setTimeout(() => {
        setItems((prev) => prev.filter((toastItem) => toastItem.id !== item.id));
      }, 5000),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [items]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto rounded-md border border-steel-200 bg-white p-3 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-steel-900">{item.title}</p>
              {item.description ? (
                <p className="text-xs text-steel-600">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Close"
              className="rounded-sm p-1 text-steel-500 hover:bg-steel-100"
              onClick={() => {
                setItems((prev) => prev.filter((toastItem) => toastItem.id !== item.id));
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {item.actionLabel ? (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-primary hover:underline"
              onClick={() => {
                item.onAction?.();
                setItems((prev) => prev.filter((toastItem) => toastItem.id !== item.id));
              }}
            >
              {item.actionLabel}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
