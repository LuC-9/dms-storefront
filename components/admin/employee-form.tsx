"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmployeeFormProps = {
  initial?: {
    id?: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    address: string;
    joinDate: string;
    baseSalary: number;
  };
};

export function EmployeeForm({ initial }: EmployeeFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    role: initial?.role ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    joinDate: initial?.joinDate ?? new Date().toISOString().slice(0, 10),
    baseSalary: String(initial?.baseSalary ?? 0),
  });
  const [message, setMessage] = useState("");

  const endpoint = initial?.id ? `/api/admin/employees/${initial.id}` : "/api/admin/employees";
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
            baseSalary: Number(form.baseSalary),
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
          <Label>Role</Label>
          <Input
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            required
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Address</Label>
        <Input
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          required
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Join Date</Label>
          <Input
            type="date"
            value={form.joinDate}
            onChange={(event) => setForm((prev) => ({ ...prev, joinDate: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Base Salary (Paise)</Label>
          <Input
            type="number"
            value={form.baseSalary}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, baseSalary: event.target.value }))
            }
            required
          />
        </div>
      </div>
      <Button type="submit">{initial?.id ? "Update Employee" : "Create Employee"}</Button>
      {message ? <p className="text-sm text-steel-600">{message}</p> : null}
    </form>
  );
}
