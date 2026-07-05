"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError("Unable to process request right now. Please try again.");
        return;
      }

      setSuccess(
        "If your email exists, a reset link has been generated. In development, check server logs.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-sm py-8">
      <div className="border border-steel-500/25 bg-alloy-white p-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Reset password</h1>
        <div className="mt-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error ? <Alert className="border-red-300 text-red-700">{error}</Alert> : null}
            {success ? <Alert className="border-green-300 text-green-700">{success}</Alert> : null}
            <Button
              type="submit"
              className="w-full rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Send reset link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
