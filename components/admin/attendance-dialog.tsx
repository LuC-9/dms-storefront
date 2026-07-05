"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function AttendanceDialog({ employeeId }: { employeeId: string }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    status: "PRESENT",
    notes: "",
  });
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-2 rounded-md border border-steel-200 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch(`/api/admin/employees/${employeeId}/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setMessage(response.ok ? "Attendance added" : "Failed to add attendance");
      }}
    >
      <h3 className="font-medium">Add Attendance Record</h3>
      <div className="grid gap-2 md:grid-cols-3">
        <div>
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="PRESENT">PRESENT</option>
            <option value="ABSENT">ABSENT</option>
            <option value="HALF_DAY">HALF_DAY</option>
            <option value="LEAVE">LEAVE</option>
          </Select>
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </div>
      <Button type="submit" size="sm">Save Attendance</Button>
      {message ? <p className="text-xs text-steel-600">{message}</p> : null}
    </form>
  );
}
