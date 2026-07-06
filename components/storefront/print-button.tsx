"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 border border-iron-800 bg-iron-800 px-5 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white hover:bg-forge-950"
    >
      <Printer className="h-4 w-4" />
      Print / Download PDF
    </button>
  );
}
