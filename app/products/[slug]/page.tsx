import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { Price } from "@/components/storefront/price";
import { getSkuLabel, getSpecLabel } from "@/components/storefront/product-spec";
import { requireCustomerSession } from "@/lib/rbac";
import { ProductImagePanel } from "@/components/storefront/product-image-panel";
import { ProductDetailInfo } from "@/components/storefront/product-detail-info";
import {
  ProductSpecTable,
  ProductDescriptionSection,
  RelatedProductsSection,
} from "@/components/storefront/product-detail-sections";
import { ProductCard } from "@/components/storefront/product-card";
import { Stagger, StaggerItem } from "@/components/storefront/reveal";

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

  if (!product) notFound();

  const [variants, relatedProducts] = await Promise.all([
    prisma.productVariant.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id } },
      take: 4,
      include: { category: true },
    }),
  ]);

  const sku = getSkuLabel({ sku: product.sku, name: product.name, category: product.category.name });
  const spec = getSpecLabel({ sku: product.sku, name: product.name, category: product.category.name });

  return (
    <div className="container space-y-8 py-8 md:py-12">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Catalogue", href: "/catalogue" },
          { label: product.category.name, href: `/categories/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductImagePanel
          imageUrl={product.imageUrl}
          alt={product.name}
          inStock={product.inStock}
        />
        <ProductDetailInfo
          categoryName={product.category.name}
          productName={product.name}
          sku={sku}
          spec={spec}
          priceInPaise={product.priceInPaise}
          inStock={product.inStock}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            imageUrl: product.imageUrl,
            priceInPaise: product.priceInPaise,
            inStock: product.inStock,
            stockCount: product.stockCount,
            lowStockAlert: product.lowStockAlert,
          }}
          variants={variants}
          initialEmail={session?.user.email}
        />
      </div>

      <ProductSpecTable
        rows={[
          { label: "SKU", value: sku },
          { label: "Category", value: product.category.name },
          { label: "Stock status", value: product.inStock ? "Available" : "Out of stock" },
          { label: "Price", value: <Price valueInPaise={product.priceInPaise} /> },
        ]}
      />

      <ProductDescriptionSection description={product.description} />

      {relatedProducts.length > 0 && (
        <RelatedProductsSection categoryName={product.category.name}>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <StaggerItem key={related.id} direction="scale">
                <ProductCard product={related} />
              </StaggerItem>
            ))}
          </Stagger>
        </RelatedProductsSection>
      )}
    </div>
  );
}
