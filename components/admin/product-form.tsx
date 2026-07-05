"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";

type ProductFormProps = {
  categories: { id: string; name: string }[];
  initial?: {
    id?: string;
    name: string;
    slug: string;
    description: string;
    priceInPaise: number;
    imageUrl: string;
    sku?: string | null;
    inStock: boolean;
    categoryId: string;
  };
  waitingCount?: number;
};

export function ProductForm({ categories, initial, waitingCount = 0 }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    priceInPaise: String(initial?.priceInPaise ?? 0),
    imageUrl: initial?.imageUrl ?? "",
    sku: initial?.sku ?? "",
    inStock: initial?.inStock ?? true,
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
  });
  const [message, setMessage] = useState("");

  const endpoint = initial?.id ? `/api/admin/products/${initial.id}` : "/api/admin/products";
  const method = initial?.id ? "PUT" : "POST";

  return (
    <form
      className="space-y-3 rounded-md border border-steel-200 bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            slug: form.slug || slugify(form.name),
            priceInPaise: Number(form.priceInPaise),
          }),
        });
        setMessage(response.ok ? "Saved successfully" : "Save failed");
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input
            value={form.slug}
            onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Price (Paise)</Label>
          <Input
            type="number"
            value={form.priceInPaise}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, priceInPaise: event.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-1">
          <Label>SKU</Label>
          <Input
            value={form.sku}
            onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Category</Label>
        <Select
          value={form.categoryId}
          onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Image URL</Label>
        <Input
          value={form.imageUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.inStock}
          onChange={(event) => setForm((prev) => ({ ...prev, inStock: event.target.checked }))}
        />
        In stock
      </label>
      {initial?.id ? (
        <div className="rounded-md border border-steel-200 bg-steel-50 p-3 text-sm text-steel-700">
          <p>
            Waiting for stock notification:{" "}
            <span className="font-semibold text-iron-900">{waitingCount}</span>
          </p>
          {form.inStock && waitingCount > 0 ? (
            <p className="mt-1 text-xs text-steel-600">
              {waitingCount} customer{waitingCount === 1 ? " is" : "s are"} waiting for this item.
            </p>
          ) : null}
        </div>
      ) : null}
      <Button type="submit">{initial?.id ? "Update Product" : "Create Product"}</Button>
      {message ? <p className="text-sm text-steel-600">{message}</p> : null}
    </form>
  );
}
