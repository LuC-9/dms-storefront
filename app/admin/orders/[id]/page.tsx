import { redirect } from "next/navigation";
import { requireAdminSession, type AdminRole } from "@/lib/rbac";
import { AdminOrderDetail } from "@/components/admin/admin-order-detail";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user.role === "customer") {
    redirect("/admin/login");
  }

  const { id } = await params;

  return <AdminOrderDetail orderId={id} role={session.user.role as AdminRole} />;
}
