"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";

type CategoryFormProps = {
  initial?: {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
  };
};

export function CategoryForm({ initial }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [message, setMessage] = useState("");

  const endpoint = initial?.id ? `/api/admin/categories/${initial.id}` : "/api/admin/categories";
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
            name,
            slug: slug || slugify(name),
            description,
            imageUrl,
          }),
        });
        setMessage(response.ok ? "Saved successfully" : "Save failed");
      }}
    >
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Slug</Label>
        <Input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="auto-generated if empty"
        />
      </div>
      <div className="space-y-1">
        <Label>Image URL</Label>
        <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <Button type="submit">{initial?.id ? "Update Category" : "Create Category"}</Button>
      {message ? <p className="text-sm text-steel-600">{message}</p> : null}
    </form>
  );
}
