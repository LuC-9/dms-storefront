import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminSession } from "@/lib/rbac";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN");
  if (!session) notFound();

  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { stockNotifications: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <ProductForm
        categories={categories}
        initial={product}
        waitingCount={product._count.stockNotifications}
      />
    </div>
  );
}
