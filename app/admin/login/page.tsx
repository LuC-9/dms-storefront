"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin1");
  const [password, setPassword] = useState("pwd1");
  const [error, setError] = useState("");

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Delta Mills Store</CardTitle>
            <Badge className="bg-steel-200 text-steel-800">Staff portal</Badge>
          </div>
          <p className="text-sm text-steel-600">Admin Login</p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await signIn("admin", {
                username,
                password,
                redirect: false,
              });

              if (result?.ok) {
                router.push("/admin");
                router.refresh();
              } else {
                setError("Invalid credentials");
              }
            }}
          >
            <div className="space-y-1">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
