"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminHeader() {
  const { data } = useSession();

  return (
    <div className="flex items-center justify-between border-b border-steel-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.05em] text-iron-800">
          Delta Mills Store - Admin
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-steel-600">
        <p>{data?.user?.username ?? "admin"}</p>
        {data?.user?.userType === "admin" && data.user.role !== "customer" ? (
          <Badge>{data.user.role}</Badge>
        ) : null}
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
