import { redirect } from "next/navigation";
import { requireAdminSession, type AdminRole } from "@/lib/rbac";
import { AdminOrdersList } from "@/components/admin/admin-orders-list";

export default async function AdminMyOrdersPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user.role === "customer") {
    redirect("/admin/login");
  }

  return (
    <AdminOrdersList
      role={session.user.role as AdminRole}
      title="My Assigned Orders"
      assignedToMe
      userId={session.user.id}
      showStatusActions={false}
    />
  );
}
