import {
  requireAdminSession as requireAdminSessionWithRbac,
  type AdminRole,
} from "@/lib/rbac";

export async function requireAdminSession(...allowedRoles: AdminRole[]) {
  return requireAdminSessionWithRbac(...allowedRoles);
}
