import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { Reveal } from "@/components/storefront/reveal";

export default async function CataloguePage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      products: {
        select: { id: true, imageUrl: true, slug: true, name: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

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
      <section className="border-y border-steel-500/20 bg-alloy-white">
        {categories.map((category, index) => (
          <Reveal key={category.id} delayMs={index * 35}>
            <article className="grid gap-4 border-b border-steel-500/20 p-4 last:border-b-0 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">
                    {category.name}
                  </h2>
                  <p className="font-mono text-sm tracking-[0.03em] text-steel-500">
                    {category._count.products} products
                  </p>
                </div>
                <p className="text-sm text-steel-500">{category.description ?? "Industrial catalogue range."}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {category.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group relative h-20 overflow-hidden border border-steel-500/25"
                    >
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                        sizes="140px"
                      />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="self-end">
                <Link
                  href={`/categories/${category.slug}`}
                  className="font-display text-sm font-semibold uppercase tracking-[0.05em] text-safety-orange"
                >
                  Browse →
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
