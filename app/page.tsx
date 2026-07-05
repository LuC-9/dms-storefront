import { Hero } from "@/components/storefront/hero";
import { CategoryCard } from "@/components/storefront/category-card";
import { ProductCard } from "@/components/storefront/product-card";
import { Reveal } from "@/components/storefront/reveal";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-0">
      <Hero />
      <section className="py-8 md:py-12">
        <div className="container space-y-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Category index</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 6).map((category, index) => (
              <Reveal key={category.id} delayMs={index * 40}>
                <CategoryCard category={category} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-alloy-white py-8 md:py-12">
        <div className="container space-y-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Featured products</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <Reveal key={product.id} delayMs={index * 45}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-iron-800 py-8 md:py-12">
        <div className="container">
          <Reveal>
            <h2 className="font-display text-3xl font-bold uppercase tracking-[0.05em] text-alloy-white">
              Delta Mill Stores
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-blueprint-100">
              Industrial hardware and machinery suppliers serving workshops, plants, and procurement
              teams from Kanpur.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
