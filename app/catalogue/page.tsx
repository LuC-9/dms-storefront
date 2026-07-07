import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { Reveal } from "@/components/storefront/reveal";
import { CatalogueFilters } from "@/components/storefront/catalogue-filters";
import { CatalogueProductGrid } from "@/components/storefront/catalogue-product-grid";
import { CatalogueFilterChips, ActiveFilterPills } from "@/components/storefront/catalogue-filter-chips";

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

  const hasFilters =
    inStockOnly || minPriceRupees !== null || maxPriceRupees !== null || categorySlug !== null;

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
  const buildUrl = (overrides: Partial<Record<keyof SearchParams, string | null>>) =>
    buildFilterUrl(params, overrides);

  const activePills: { label: string; href: string }[] = [];
  if (inStockOnly) activePills.push({ label: "In stock only", href: buildUrl({ inStock: null }) });
  if (activeCategory) activePills.push({ label: activeCategory.name, href: buildUrl({ category: null }) });
  if (minPriceRupees !== null || maxPriceRupees !== null) {
    activePills.push({
      label:
        minPriceRupees !== null && maxPriceRupees !== null
          ? `₹${minPriceRupees.toLocaleString("en-IN")} – ₹${maxPriceRupees.toLocaleString("en-IN")}`
          : minPriceRupees !== null
            ? `From ₹${minPriceRupees.toLocaleString("en-IN")}`
            : `Up to ₹${maxPriceRupees!.toLocaleString("en-IN")}`,
      href: buildUrl({ minPrice: null, maxPrice: null }),
    });
  }

  return (
    <div className="container space-y-6 py-8 md:py-12">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Catalogue" }]} />

      <Reveal direction="blur">
        <section className="space-y-2">
          <p className="industrial-eyebrow">Valve desk · Ready stock</p>
          <h1 className="section-heading mt-2">Industrial catalogue</h1>
          <p className="mt-2 text-sm text-steel-500">
            Valves, fittings, and industrial hardware for B2B enquiries and bulk orders.
          </p>
        </section>
      </Reveal>

      <div className="industrial-surface overflow-hidden p-4 md:p-5">
        <CatalogueFilterChips
          inStockHref={buildUrl({ inStock: inStockOnly ? null : "true" })}
          inStockOnly={inStockOnly}
          allCategoriesHref={buildUrl({ category: null })}
          categorySlug={categorySlug}
          categoryChips={categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            href: buildUrl({ category: cat.slug === categorySlug ? null : cat.slug }),
            active: cat.slug === categorySlug,
          }))}
        />
        <div className="mt-4 border-t border-steel-100 pt-4">
          <CatalogueFilters
            currentParams={{
              inStock: params.inStock,
              minPrice: params.minPrice,
              maxPrice: params.maxPrice,
              category: params.category,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-steel-500">
          Showing <span className="font-semibold text-iron-800">{products.length}</span>{" "}
          {products.length === 1 ? "product" : "products"}
          {activeCategory ? ` in ${activeCategory.name}` : ""}
        </p>
        {hasFilters && (
          <Link href="/catalogue" className="text-sm font-medium text-safety-orange hover:underline">
            Clear filters
          </Link>
        )}
      </div>

      {hasFilters && <ActiveFilterPills pills={activePills} />}

      <CatalogueProductGrid products={products} />
    </div>
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
    if (override === null) continue;
    if (override !== undefined) next[key] = override;
    else if (current[key]) next[key] = current[key]!;
  }
  const qs = new URLSearchParams(next).toString();
  return qs ? `/catalogue?${qs}` : "/catalogue";
}
