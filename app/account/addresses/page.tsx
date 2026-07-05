"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type Address = {
  id: string;
  label?: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type AddressDraft = {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

function defaultDraft(): AddressDraft {
  return {
    label: "",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  };
}

function toDraft(address: Address): AddressDraft {
  return {
    label: address.label ?? "",
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    isDefault: address.isDefault,
  };
}

function AddressForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
}: {
  value: AddressDraft;
  onChange: (next: AddressDraft) => void;
  onSubmit: (event: FormEvent) => void;
  submitLabel: string;
}) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="address-label">Label</Label>
          <Input
            id="address-label"
            value={value.label}
            onChange={(event) => onChange({ ...value, label: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="address-fullName">Full name</Label>
          <Input
            id="address-fullName"
            required
            value={value.fullName}
            onChange={(event) => onChange({ ...value, fullName: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="address-phone">Phone</Label>
          <Input
            id="address-phone"
            required
            value={value.phone}
            onChange={(event) => onChange({ ...value, phone: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="address-pincode">Pincode</Label>
          <Input
            id="address-pincode"
            required
            value={value.pincode}
            onChange={(event) => onChange({ ...value, pincode: event.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address-line1">Address line 1</Label>
          <Input
            id="address-line1"
            required
            value={value.line1}
            onChange={(event) => onChange({ ...value, line1: event.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address-line2">Address line 2</Label>
          <Input
            id="address-line2"
            value={value.line2}
            onChange={(event) => onChange({ ...value, line2: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="address-city">City</Label>
          <Input
            id="address-city"
            required
            value={value.city}
            onChange={(event) => onChange({ ...value, city: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="address-state">State</Label>
          <Input
            id="address-state"
            required
            value={value.state}
            onChange={(event) => onChange({ ...value, state: event.target.value })}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.isDefault}
          onChange={(event) => onChange({ ...value, isDefault: event.target.checked })}
        />
        Set as default address
      </label>
      <Button
        type="submit"
        className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
      >
        {submitLabel}
      </Button>
    </form>
  );
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDraft, setCreateDraft] = useState<AddressDraft>(defaultDraft());
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editDraft, setEditDraft] = useState<AddressDraft>(defaultDraft());

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/addresses", { cache: "no-store" });
      const json = (await response.json()) as { items: Address[] };
      setAddresses(json.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAddresses();
  }, []);

  return (
    <div className="border border-steel-500/25 bg-alloy-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Addresses</h1>
          <p className="text-sm text-steel-500">Manage delivery locations.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
            >
              Add address
            </Button>
          </DialogTrigger>
          <DialogContent className="border-steel-500 bg-alloy-white">
            <DialogHeader>
              <DialogTitle>New address</DialogTitle>
              <DialogDescription>Save a delivery address for future orders.</DialogDescription>
            </DialogHeader>
            <AddressForm
              value={createDraft}
              onChange={setCreateDraft}
              submitLabel="Create address"
              onSubmit={async (event) => {
                event.preventDefault();
                const response = await fetch("/api/addresses", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...createDraft,
                    label: createDraft.label || undefined,
                    line2: createDraft.line2 || undefined,
                  }),
                });
                if (!response.ok) {
                  toast("Could not create address");
                  return;
                }
                toast("Address added");
                setCreateDraft(defaultDraft());
                await loadAddresses();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-steel-500">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="mt-4 border border-steel-500/30 p-6 text-center text-sm text-steel-500">
          No saved addresses yet.
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {addresses.map((address) => (
            <article key={address.id} className="border border-steel-500/25 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {address.fullName}
                    {address.label ? ` · ${address.label}` : ""}
                  </p>
                  <p className="text-sm text-steel-500">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p className="text-xs text-steel-500">{address.phone}</p>
                </div>
                {address.isDefault ? <Badge>Default</Badge> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-forge-950"
                  onClick={() => {
                    setEditingAddress(address);
                    setEditDraft(toDraft(address));
                  }}
                >
                  Edit
                </Button>
                {!address.isDefault ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none"
                    onClick={async () => {
                      await fetch(`/api/addresses/${address.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isDefault: true }),
                      });
                      await loadAddresses();
                      toast("Default address updated");
                    }}
                  >
                    Set default
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-none text-safety-orange hover:bg-blueprint-100 hover:text-safety-orange"
                  onClick={async () => {
                    const confirmed = window.confirm("Delete this address?");
                    if (!confirmed) {
                      return;
                    }
                    const response = await fetch(`/api/addresses/${address.id}`, { method: "DELETE" });
                    if (!response.ok) {
                      toast("Could not delete address");
                      return;
                    }
                    toast("Address deleted");
                    await loadAddresses();
                  }}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editingAddress)} onOpenChange={(open) => !open && setEditingAddress(null)}>
        <DialogContent className="border-steel-500 bg-alloy-white">
          <DialogHeader>
            <DialogTitle>Edit address</DialogTitle>
            <DialogDescription>Update your saved address details.</DialogDescription>
          </DialogHeader>
          <AddressForm
            value={editDraft}
            onChange={setEditDraft}
            submitLabel="Save changes"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!editingAddress) {
                return;
              }
              const response = await fetch(`/api/addresses/${editingAddress.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...editDraft,
                  label: editDraft.label || undefined,
                  line2: editDraft.line2 || undefined,
                }),
              });
              if (!response.ok) {
                toast("Could not update address");
                return;
              }
              toast("Address updated");
              setEditingAddress(null);
              await loadAddresses();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
