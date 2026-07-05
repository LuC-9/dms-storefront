"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type AccountProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/account", { cache: "no-store" });
        const json = (await response.json()) as AccountProfile;
        setProfile(json);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading || !profile) {
    return <div className="border border-steel-500/25 bg-alloy-white p-4 text-sm text-steel-500">Loading profile...</div>;
  }

  return (
    <div className="border border-steel-500/25 bg-alloy-white p-4">
      <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Profile</h1>
      <p className="mt-1 text-sm text-steel-500">Manage your account details.</p>
      <form
        className="mt-5 space-y-4"
        onSubmit={async (event: FormEvent) => {
          event.preventDefault();
          setSaving(true);
          try {
            const response = await fetch("/api/account", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: profile.name, phone: profile.phone }),
            });
            if (!response.ok) {
              toast("Could not update profile");
              return;
            }
            const updated = (await response.json()) as AccountProfile;
            setProfile(updated);
            toast("Profile updated");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div>
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={profile.name}
            onChange={(event) => setProfile((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
          />
        </div>
        <div>
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={profile.email} readOnly disabled />
        </div>
        <div>
          <Label htmlFor="profile-phone">Phone</Label>
          <Input
            id="profile-phone"
            value={profile.phone ?? ""}
            onChange={(event) =>
              setProfile((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
            }
          />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
        >
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
