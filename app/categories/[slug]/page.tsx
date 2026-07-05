import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/product-card";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { CategoryFilters } from "@/components/storefront/category-filters";
import { Reveal } from "@/components/storefront/reveal";

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ stock?: string }>;
}) {
  const { slug } = await params;
  const { stock } = await searchParams;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { products: { orderBy: { name: "asc" } } },
  });

  if (!category) {
    notFound();
  }

  const filteredProducts = category.products.filter((product) => {
    if (stock === "available") {
      return product.inStock;
    }
    if (stock === "unavailable") {
      return !product.inStock;
    }
    return true;
  });

  return (
    <div className="container space-y-6 py-8 md:py-12">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Catalogue", href: "/catalogue" },
          { label: category.name },
        ]}
      />
      <Reveal>
        <section className="border border-steel-500 bg-forge-950 p-4">
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em] text-alloy-white">
            {category.name}
          </h1>
          <p className="mt-2 text-sm text-blueprint-100">{category.description ?? "Industrial category range."}</p>
        </section>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <CategoryFilters />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product, index) => (
            <Reveal key={product.id} delayMs={index * 35}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
