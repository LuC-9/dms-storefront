import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { Price } from "@/components/storefront/price";
import { SpecPlate } from "@/components/storefront/spec-plate";
import { getSkuLabel, getSpecLabel } from "@/components/storefront/product-spec";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { requireCustomerSession } from "@/lib/rbac";
import { Reveal } from "@/components/storefront/reveal";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, session] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    }),
    requireCustomerSession(),
  ]);

  if (!product) {
    notFound();
  }

  const sku = getSkuLabel({ sku: product.sku, name: product.name, category: product.category.name });
  const spec = getSpecLabel({ sku: product.sku, name: product.name, category: product.category.name });

  return (
    <div className="container space-y-6 py-8 md:py-12">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Catalogue", href: "/catalogue" },
          { label: product.category.name, href: `/categories/${product.category.slug}` },
          { label: product.name },
        ]}
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={800}
          height={550}
          className="w-full border border-steel-500/25 object-cover"
        />
        <Reveal className="space-y-4">
          <p className="inline-flex border border-steel-500/30 bg-blueprint-100 px-2 py-1 text-2xs font-mono uppercase tracking-[0.05em] text-steel-500">
            {product.category.name}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-[0.02em]">{product.name}</h1>
          <SpecPlate
            lines={[
              `SKU    ${sku}`,
              `SPEC   ${spec}`,
              "MFR    Delta Mill Stores · Kanpur",
            ]}
          />
          <p className="text-2xl">
            <Price valueInPaise={product.priceInPaise} className="text-2xl" />
          </p>
          <p className="text-sm text-steel-500">
            {product.inStock ? "● Available for dispatch" : "○ Out of stock - call to enquire"}
          </p>
          <ProductPurchasePanel
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              imageUrl: product.imageUrl,
              priceInPaise: product.priceInPaise,
              inStock: product.inStock,
            }}
            initialEmail={session?.user.email}
          />
          <p className="font-mono text-sm tracking-[0.03em] text-steel-500">Bulk enquiries: 512-2362054</p>
        </Reveal>
      </div>
      <section className="overflow-x-auto border border-steel-500/25 bg-alloy-white">
        <table className="min-w-full text-sm">
          <thead className="bg-iron-800 text-left text-alloy-white">
            <tr>
              <th className="px-4 py-3 font-medium">Parameter</th>
              <th className="px-4 py-3 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-steel-500/20">
              <td className="px-4 py-3">SKU</td>
              <td className="px-4 py-3 font-mono tracking-[0.03em]">{sku}</td>
            </tr>
            <tr className="border-t border-steel-500/20">
              <td className="px-4 py-3">Category</td>
              <td className="px-4 py-3 font-mono tracking-[0.03em]">{product.category.name}</td>
            </tr>
            <tr className="border-t border-steel-500/20">
              <td className="px-4 py-3">Stock status</td>
              <td className="px-4 py-3 font-mono tracking-[0.03em]">
                {product.inStock ? "AVAILABLE" : "OUT OF STOCK"}
              </td>
            </tr>
            <tr className="border-t border-steel-500/20">
              <td className="px-4 py-3">Price</td>
              <td className="px-4 py-3 font-mono tracking-[0.03em]">
                <Price valueInPaise={product.priceInPaise} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Description</h2>
        <p className="text-sm text-iron-800">{product.description}</p>
      </section>
    </div>
  );
}
