import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminSession } from "@/lib/rbac";
import { formatInr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminProductsPage() {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN");
  if (!session) notFound();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">New Product</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category.name}</TableCell>
              <TableCell>{formatInr(product.priceInPaise)}</TableCell>
              <TableCell className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                </Button>
                <DeleteButton endpoint={`/api/admin/products/${product.id}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div>
        <h2 className="mb-3 text-xl font-semibold">Quick Add Product</h2>
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
