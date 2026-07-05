import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminSession } from "@/lib/rbac";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCategoriesPage() {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN");
  if (!session) notFound();

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.slug}</TableCell>
              <TableCell>{category._count.products}</TableCell>
              <TableCell>
                <DeleteButton endpoint={`/api/admin/categories/${category.id}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div>
        <h2 className="mb-3 text-xl font-semibold">Add Category</h2>
        <CategoryForm />
      </div>
    </div>
  );
}
