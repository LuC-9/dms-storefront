import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminSession } from "@/lib/rbac";

export default async function AdminNewProductPage() {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN");
  if (!session) notFound();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
