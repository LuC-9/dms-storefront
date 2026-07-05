"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        setError("Reset link is invalid or expired.");
        return;
      }

      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-sm py-8">
      <div className="border border-steel-500/25 bg-alloy-white p-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Reset password</h1>
        <div className="mt-4">
          {token ? (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              {error ? <Alert className="border-red-300 text-red-700">{error}</Alert> : null}
              <Button
                type="submit"
                className="w-full rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          ) : (
            <Alert className="border-red-300 text-red-700">
              Missing reset token. Please request a new password reset link.
            </Alert>
          )}

          <p className="mt-4 text-sm text-steel-500">
            Back to{" "}
            <Link href="/login" className="text-iron-800 underline-offset-4 hover:underline">
              sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
