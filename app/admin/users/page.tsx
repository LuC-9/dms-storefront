import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/rbac";
import { AdminUsersManagement } from "@/components/admin/admin-users-management";

export default async function AdminUsersPage() {
  const session = await requireAdminSession("SUPER_ADMIN");
  if (!session) {
    notFound();
  }

  return <AdminUsersManagement />;
}
