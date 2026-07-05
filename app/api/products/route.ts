import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  const limit = Number(searchParams.get("limit") ?? "100");
  const offset = Number(searchParams.get("offset") ?? "0");

  const products = await prisma.product.findMany({
    where: categorySlug ? { category: { slug: categorySlug } } : undefined,
    include: { category: true },
    orderBy: { name: "asc" },
    skip: Number.isFinite(offset) ? offset : 0,
    take: Number.isFinite(limit) ? limit : 100,
  });

  return NextResponse.json(products);
}
