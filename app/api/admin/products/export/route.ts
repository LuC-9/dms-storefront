import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const CSV_HEADERS = [
  "id",
  "name",
  "slug",
  "description",
  "priceInPaise",
  "imageUrl",
  "sku",
  "hsn",
  "inStock",
  "stockCount",
  "lowStockAlert",
  "categoryName",
  "createdAt",
];

function escapeField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // If field contains comma, double-quote, or newline — wrap in quotes and escape inner quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(values: (string | number | boolean | null | undefined)[]): string {
  return values.map(escapeField).join(",");
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows: string[] = [CSV_HEADERS.join(",")];

  for (const product of products) {
    rows.push(
      buildCsvRow([
        product.id,
        product.name,
        product.slug,
        product.description,
        product.priceInPaise,
        product.imageUrl,
        product.sku,
        product.hsn,
        product.inStock,
        product.stockCount,
        product.lowStockAlert,
        product.category.name,
        product.createdAt.toISOString(),
      ]),
    );
  }

  const csv = rows.join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="products-export.csv"',
    },
  });
}
