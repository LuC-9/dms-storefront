"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteButton({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const ok = window.confirm("Delete this item?");
        if (!ok) return;
        const response = await fetch(endpoint, { method: "DELETE" });
        if (response.ok) router.refresh();
      }}
    >
      Delete
    </Button>
  );
}
