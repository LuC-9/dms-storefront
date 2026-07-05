import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE";

export async function requireCustomerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.userType !== "customer") {
    return null;
  }
  return session;
}

export async function requireAdminSession(...allowedRoles: AdminRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.userType !== "admin") {
    return null;
  }

  if (allowedRoles.length === 0) {
    return session;
  }

  const role = session.user.role;
  if (role === "customer") {
    return null;
  }

  return allowedRoles.includes(role) ? session : null;
}

export function hasAdminRole(
  session: Session | null | undefined,
  ...roles: AdminRole[]
) {
  if (!session?.user || session.user.userType !== "admin") {
    return false;
  }
  if (roles.length === 0) {
    return true;
  }
  const role = session.user.role;
  return role !== "customer" && roles.includes(role);
}
