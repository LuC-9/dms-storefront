import { Hero } from "@/components/storefront/hero";
import { CategoryCard } from "@/components/storefront/category-card";
import { ProductCard } from "@/components/storefront/product-card";
import { Reveal, Stagger, StaggerItem } from "@/components/storefront/reveal";
import { TrustSection } from "@/components/storefront/trust-section";
import { CtaBanner } from "@/components/storefront/cta-banner";
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
      <TrustSection />

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="container space-y-6">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <p className="industrial-eyebrow">Valve desk · Catalogue</p>
                <h2 className="section-heading mt-2">Shop by industrial line</h2>
              </div>
              <a href="/catalogue" className="hidden text-sm font-semibold text-safety-orange hover:underline sm:block">
                See all →
              </a>
            </div>
          </Reveal>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((category, index) => (
              <StaggerItem key={category.id} direction="scale">
                <CategoryCard category={category} featured={index === 0} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-surface-muted/50 py-12 md:py-16">
        <div className="container space-y-6">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <p className="industrial-eyebrow">Ready stock · B2B supply</p>
                <h2 className="section-heading mt-2">Featured valves &amp; hardware</h2>
              </div>
              <a href="/catalogue" className="hidden text-sm font-semibold text-safety-orange hover:underline sm:block">
                See more →
              </a>
            </div>
          </Reveal>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <StaggerItem key={product.id} direction="scale">
                <ProductCard product={product} featured={index === 0} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}
