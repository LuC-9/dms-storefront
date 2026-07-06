"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export function CsvImportDialog() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setResult(null);
    setError(null);
    setSubmitting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ImportResult | { error?: { message?: string } };

      if (!response.ok) {
        const errData = data as { error?: { message?: string } };
        setError(errData.error?.message ?? "Import failed");
        return;
      }

      const importResult = data as ImportResult;
      setResult(importResult);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Products CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create or update products. Required columns:{" "}
            <code className="text-xs">name, slug, description, priceInPaise, imageUrl, sku, hsn, inStock, stockCount, categoryName</code>
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-md border border-green-200 bg-green-50 p-2">
                <p className="text-xl font-bold text-green-700">{result.created}</p>
                <p className="text-xs text-green-600">Created</p>
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-2">
                <p className="text-xl font-bold text-blue-700">{result.updated}</p>
                <p className="text-xs text-blue-600">Updated</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
                <p className="text-xl font-bold text-amber-700">{result.skipped}</p>
                <p className="text-xs text-amber-600">Skipped</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2">
                <p className="mb-1 text-xs font-semibold text-red-700">
                  Errors ({result.errors.length})
                </p>
                <ul className="space-y-0.5">
                  {result.errors.map((msg, i) => (
                    <li key={i} className="text-xs text-red-700">
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={reset}>
                Import Another
              </Button>
              <DialogClose asChild>
                <Button size="sm">Done</Button>
              </DialogClose>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="csv-file-input"
                className="block text-sm font-medium text-steel-800"
              >
                CSV File
              </label>
              <input
                id="csv-file-input"
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                required
                className="mt-1 block w-full text-sm text-steel-700 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-steel-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-steel-50"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Importing…" : "Upload & Import"}
              </Button>
              <DialogClose asChild>
                <Button type="button" size="sm" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
