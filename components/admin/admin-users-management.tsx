"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminRole } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";

const ROLE_OPTIONS: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"];

type AdminUserRow = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  role: AdminRole;
  createdAt: string;
};

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return fallback;
}

const ROLE_BADGE_CLASS: Record<AdminRole, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-blue-100 text-blue-700",
  MANAGER: "bg-violet-100 text-violet-700",
  EMPLOYEE: "bg-slate-200 text-slate-700",
};

export function AdminUsersManagement() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, AdminRole>>({});
  const [passwordDraft, setPasswordDraft] = useState<Record<string, string>>({});
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "EMPLOYEE" as AdminRole,
  });

  const superAdminCount = useMemo(
    () => users.filter((user) => user.role === "SUPER_ADMIN").length,
    [users],
  );

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = (await response.json()) as AdminUserRow[] | { error?: { message?: string } };
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(extractErrorMessage(payload, "Failed to load admin users."));
      }
      setUsers(payload);
      setRoleDraft(Object.fromEntries(payload.map((user) => [user.id, user.role])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const createUser = async () => {
    setError(null);
    setMessage(null);
    if (newUser.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newUser.username.trim(),
        password: newUser.password,
        name: newUser.name.trim() || undefined,
        email: newUser.email.trim() || undefined,
        role: newUser.role,
      }),
    });
    const payload = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      setError(extractErrorMessage(payload, "Failed to create admin user."));
      return;
    }

    setMessage("Admin user added.");
    setAddOpen(false);
    setNewUser({ username: "", password: "", name: "", email: "", role: "EMPLOYEE" });
    await loadUsers();
  };

  const saveRole = async (user: AdminUserRow) => {
    const nextRole = roleDraft[user.id];
    if (!nextRole || nextRole === user.role) return;

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const payload = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      setError(extractErrorMessage(payload, "Failed to update role."));
      return;
    }
    setMessage(`Updated ${user.username} to ${nextRole}.`);
    await loadUsers();
  };

  const resetPassword = async (user: AdminUserRow) => {
    const password = passwordDraft[user.id]?.trim();
    if (!password) {
      setError("Enter a new password first.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      setError(extractErrorMessage(payload, "Failed to reset password."));
      return;
    }
    setMessage(`Password reset for ${user.username}.`);
    setPasswordDraft((prev) => ({ ...prev, [user.id]: "" }));
  };

  const deleteUser = async (user: AdminUserRow) => {
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      setError(extractErrorMessage(payload, "Failed to delete user."));
      return;
    }
    setMessage(`${user.username} deleted.`);
    setDeleteTarget(null);
    await loadUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Admin users</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => setAddOpen((prev) => !prev)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add admin
            </Button>
          </DialogTrigger>
          {addOpen ? (
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create admin user</DialogTitle>
                <DialogDescription>Add an internal admin login with role assignment.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Username</Label>
                  <Input
                    value={newUser.username}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, username: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={newUser.name}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select
                    value={newUser.role}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, role: event.target.value as AdminRole }))
                    }
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => void createUser()}>
                    Save
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          ) : null}
        </Dialog>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-steel-600">Loading users...</p>
          ) : users.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <p className="text-lg font-medium text-steel-700">No admin users yet</p>
              <p className="text-sm text-steel-600">Add the first admin account to start.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isOnlySuperAdmin = user.role === "SUPER_ADMIN" && superAdminCount <= 1;
                  const roleChanged = roleDraft[user.id] && roleDraft[user.id] !== user.role;

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name || "—"}</TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_BADGE_CLASS[user.role]}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>{formatCreatedAt(user.createdAt)}</TableCell>
                      <TableCell className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={roleDraft[user.id] ?? user.role}
                            onChange={(event) =>
                              setRoleDraft((prev) => ({ ...prev, [user.id]: event.target.value as AdminRole }))
                            }
                            disabled={isOnlySuperAdmin}
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void saveRole(user)}
                            disabled={!roleChanged || isOnlySuperAdmin}
                          >
                            Edit role
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="password"
                            placeholder="New password"
                            value={passwordDraft[user.id] ?? ""}
                            onChange={(event) =>
                              setPasswordDraft((prev) => ({ ...prev, [user.id]: event.target.value }))
                            }
                            className="max-w-48"
                          />
                          <Button size="sm" variant="outline" onClick={() => void resetPassword(user)}>
                            Reset password
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTarget(user)}
                            disabled={isOnlySuperAdmin}
                          >
                            Delete
                          </Button>
                        </div>
                        {isOnlySuperAdmin ? (
                          <p className="text-xs text-steel-500">
                            Last SUPER_ADMIN cannot be deleted or demoted.
                          </p>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {deleteTarget ? (
        <Dialog>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete admin user?</DialogTitle>
              <DialogDescription>
                This will remove {deleteTarget.username}. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value="Confirm deletion and proceed."
              readOnly
              className="min-h-[60px] text-sm text-steel-600"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button onClick={() => void deleteUser(deleteTarget)}>Delete user</Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
