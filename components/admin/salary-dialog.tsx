"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SalaryDialog({ employeeId }: { employeeId: string }) {
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    baseSalary: "",
    bonus: "0",
    deductions: "0",
    netPaid: "",
    notes: "",
  });
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-2 rounded-md border border-steel-200 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch(`/api/admin/employees/${employeeId}/salary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            baseSalary: Number(form.baseSalary),
            bonus: Number(form.bonus),
            deductions: Number(form.deductions),
            netPaid: Number(form.netPaid),
          }),
        });
        setMessage(response.ok ? "Salary added" : "Failed to add salary");
      }}
    >
      <h3 className="font-medium">Add Salary Record</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <Label>Month (YYYY-MM)</Label>
          <Input value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))} required />
        </div>
        <div>
          <Label>Base Salary</Label>
          <Input type="number" value={form.baseSalary} onChange={(e) => setForm((p) => ({ ...p, baseSalary: e.target.value }))} required />
        </div>
        <div>
          <Label>Bonus</Label>
          <Input type="number" value={form.bonus} onChange={(e) => setForm((p) => ({ ...p, bonus: e.target.value }))} />
        </div>
        <div>
          <Label>Deductions</Label>
          <Input type="number" value={form.deductions} onChange={(e) => setForm((p) => ({ ...p, deductions: e.target.value }))} />
        </div>
        <div>
          <Label>Net Paid</Label>
          <Input type="number" value={form.netPaid} onChange={(e) => setForm((p) => ({ ...p, netPaid: e.target.value }))} required />
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </div>
      <Button type="submit" size="sm">Save Salary</Button>
      {message ? <p className="text-xs text-steel-600">{message}</p> : null}
    </form>
  );
}
