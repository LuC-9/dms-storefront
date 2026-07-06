import { Hero } from "@/components/storefront/hero";
import { CategoryCard } from "@/components/storefront/category-card";
import { ProductCard } from "@/components/storefront/product-card";
import { Reveal } from "@/components/storefront/reveal";
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

      {/* Trust / why us */}
      <TrustSection />

      {/* Category index */}
      <section className="bg-alloy-white py-12 md:py-16">
        <div className="container space-y-8">
          <Reveal>
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-safety-orange">
                  Browse by category
                </p>
                <h2 className="font-display text-3xl font-bold uppercase tracking-[0.04em]">
                  Category index
                </h2>
              </div>
              <a
                href="/catalogue"
                className="hidden font-mono text-xs uppercase tracking-[0.1em] text-steel-500 underline-offset-4 hover:underline sm:block"
              >
                View all →
              </a>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((category, index) => (
              <Reveal key={category.id} delayMs={index * 50}>
                <CategoryCard category={category} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-12 md:py-16">
        <div className="container space-y-8">
          <Reveal>
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-safety-orange">
                  Latest additions
                </p>
                <h2 className="font-display text-3xl font-bold uppercase tracking-[0.04em]">
                  Featured products
                </h2>
              </div>
              <a
                href="/catalogue"
                className="hidden font-mono text-xs uppercase tracking-[0.1em] text-steel-500 underline-offset-4 hover:underline sm:block"
              >
                View all →
              </a>
            </div>
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

      {/* CTA banner */}
      <CtaBanner />

      {/* About blurb */}
      <section className="bg-iron-800 py-12 md:py-16">
        <div className="container">
          <Reveal>
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-safety-orange">
                About Delta Mill Stores
              </p>
              <h2 className="font-display text-3xl font-bold uppercase tracking-[0.03em] text-alloy-white">
                Kanpur's trusted industrial supplier
              </h2>
              <p className="text-sm leading-relaxed text-blueprint-100/70">
                Delta Mill Stores — also known as Delta Machinery Store — has been supplying
                precision-grade industrial hardware, machinery components, and specialist
                instruments to workshops, OEM teams, and manufacturing plants across Uttar Pradesh
                since 1987. Our catalogue spans valves, bearings, drill bits, pumps, steel pipes,
                gauges, flanges, and much more.
              </p>
              <a
                href="/about"
                className="inline-block font-mono text-xs uppercase tracking-[0.1em] text-safety-orange underline-offset-4 hover:underline"
              >
                Read more about us →
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
