import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { Reveal } from "@/components/storefront/reveal";
import { ProductCard } from "@/components/storefront/product-card";
import { CatalogueFilters } from "@/components/storefront/catalogue-filters";

type SearchParams = {
  inStock?: string;
  minPrice?: string;
  maxPrice?: string;
  category?: string;
};

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const inStockOnly = params.inStock === "true";
  const minPriceRupees = params.minPrice ? parseInt(params.minPrice, 10) : null;
  const maxPriceRupees = params.maxPrice ? parseInt(params.maxPrice, 10) : null;
  const categorySlug = params.category ?? null;

  const hasFilters = inStockOnly || minPriceRupees !== null || maxPriceRupees !== null || categorySlug !== null;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.product.findMany({
      where: {
        ...(inStockOnly ? { inStock: true } : {}),
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(minPriceRupees !== null || maxPriceRupees !== null
          ? {
              priceInPaise: {
                ...(minPriceRupees !== null ? { gte: minPriceRupees * 100 } : {}),
                ...(maxPriceRupees !== null ? { lte: maxPriceRupees * 100 } : {}),
              },
            }
          : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div className="container space-y-6 py-8 md:py-12">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Catalogue" }]} />

      <Reveal>
        <section>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Catalogue</h1>
          <p className="mt-2 text-sm text-steel-500">
            Catalogue-only listing for industrial enquiries, quotations, and bulk orders.
          </p>
        </section>
      </Reveal>

      {/* Filter bar */}
      <div className="border border-steel-500/25 bg-alloy-white">
        <div className="border-b border-steel-500/20 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* In stock toggle */}
            <Link
              href={buildFilterUrl(params, { inStock: inStockOnly ? null : "true" })}
              className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.05em] transition-colors ${
                inStockOnly
                  ? "border-safety-orange bg-safety-orange text-alloy-white"
                  : "border-steel-500/30 bg-white text-iron-800 hover:border-iron-800"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${inStockOnly ? "bg-alloy-white" : "border border-steel-500/60"}`}
              />
              In Stock Only
            </Link>

            {/* Category filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-steel-500">Category:</span>
              <Link
                href={buildFilterUrl(params, { category: null })}
                className={`border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.04em] transition-colors ${
                  !categorySlug
                    ? "border-iron-800 bg-iron-800 text-alloy-white"
                    : "border-steel-500/30 bg-white text-iron-800 hover:border-iron-800"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildFilterUrl(params, { category: cat.slug === categorySlug ? null : cat.slug })}
                  className={`border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.04em] transition-colors ${
                    cat.slug === categorySlug
                      ? "border-iron-800 bg-iron-800 text-alloy-white"
                      : "border-steel-500/30 bg-white text-iron-800 hover:border-iron-800"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Price range — client component to handle input state */}
        <CatalogueFilters
          currentParams={{
            inStock: params.inStock,
            minPrice: params.minPrice,
            maxPrice: params.maxPrice,
            category: params.category,
          }}
        />
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-sm tracking-[0.03em] text-steel-500">
          Showing{" "}
          <span className="font-semibold text-iron-800">{products.length}</span>{" "}
          {products.length === 1 ? "product" : "products"}
          {activeCategory ? ` in ${activeCategory.name}` : ""}
        </p>
        {hasFilters && (
          <Link
            href="/catalogue"
            className="font-mono text-xs uppercase tracking-[0.05em] text-safety-orange hover:underline"
          >
            ✕ Clear filters
          </Link>
        )}
      </div>

      {/* Active filter pills */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {inStockOnly && (
            <FilterPill label="In Stock Only" href={buildFilterUrl(params, { inStock: null })} />
          )}
          {activeCategory && (
            <FilterPill
              label={activeCategory.name}
              href={buildFilterUrl(params, { category: null })}
            />
          )}
          {(minPriceRupees !== null || maxPriceRupees !== null) && (
            <FilterPill
              label={
                minPriceRupees !== null && maxPriceRupees !== null
                  ? `₹${minPriceRupees.toLocaleString("en-IN")} – ₹${maxPriceRupees.toLocaleString("en-IN")}`
                  : minPriceRupees !== null
                    ? `From ₹${minPriceRupees.toLocaleString("en-IN")}`
                    : `Up to ₹${maxPriceRupees!.toLocaleString("en-IN")}`
              }
              href={buildFilterUrl(params, { minPrice: null, maxPrice: null })}
            />
          )}
        </div>
      )}

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="border border-steel-500/20 bg-alloy-white px-8 py-16 text-center">
          <p className="font-display text-xl font-semibold uppercase tracking-[0.05em] text-iron-800">
            No products found
          </p>
          <p className="mt-2 text-sm text-steel-500">Try adjusting your filters.</p>
          <Link
            href="/catalogue"
            className="mt-4 inline-block font-mono text-sm uppercase tracking-[0.05em] text-safety-orange hover:underline"
          >
            Clear all filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <Reveal key={product.id} delayMs={index * 35}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 border border-steel-500/30 bg-blueprint-100 px-2.5 py-1 font-mono text-xs tracking-[0.03em] text-iron-800 hover:border-iron-800 transition-colors"
    >
      {label}
      <span className="text-steel-500">✕</span>
    </Link>
  );
}

function buildFilterUrl(
  current: SearchParams,
  overrides: Partial<Record<keyof SearchParams, string | null>>,
): string {
  const next: Record<string, string> = {};

  const keys: (keyof SearchParams)[] = ["inStock", "minPrice", "maxPrice", "category"];
  for (const key of keys) {
    const override = overrides[key];
    if (override === null) {
      // explicitly remove
    } else if (override !== undefined) {
      next[key] = override;
    } else if (current[key]) {
      next[key] = current[key]!;
    }
  }

  const qs = new URLSearchParams(next).toString();
  return qs ? `/catalogue?${qs}` : "/catalogue";
}
