"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(params.get("q") ?? "");

  return (
    <form
      className="flex w-full gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
    >
      <Input
        placeholder="Search products by name or description"
        className="rounded-none border-steel-500/30 bg-alloy-white placeholder:text-steel-500"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Button
        type="submit"
        className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
      >
        Search
      </Button>
    </form>
  );
}
