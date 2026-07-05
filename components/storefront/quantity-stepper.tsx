"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
};

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  disabled,
  onChange,
}: QuantityStepperProps) {
  const [draft, setDraft] = useState(String(value));
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function sanitize(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      return min;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function commit(raw: string) {
    const next = sanitize(raw);
    setDraft(String(next));
    if (next !== value) {
      onChange(next);
    }
  }

  return (
    <div className="inline-flex items-center border border-forge-950 bg-alloy-white font-mono text-sm tracking-[0.03em]">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 rounded-none border-r border-forge-950 p-0 text-forge-950 hover:bg-blueprint-100"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        value={draft}
        inputMode="numeric"
        className="h-8 w-12 rounded-none border-0 bg-transparent px-0 text-center font-mono tracking-[0.03em] focus-visible:ring-0"
        disabled={disabled}
        onChange={(event) => {
          const nextRaw = event.target.value.replace(/[^\d]/g, "");
          setDraft(nextRaw);
          if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
          }
          debounceRef.current = window.setTimeout(() => commit(nextRaw), 350);
        }}
        onBlur={() => commit(draft)}
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 rounded-none border-l border-forge-950 p-0 text-forge-950 hover:bg-blueprint-100"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
