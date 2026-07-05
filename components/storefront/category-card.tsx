import Image from "next/image";
import Link from "next/link";
import { Category } from "@prisma/client";

type CategoryCardProps = {
  category: Category & { _count?: { products: number } };
};

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <article className="group h-full overflow-hidden border border-steel-500/25 bg-alloy-white transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:scale-[1.02] motion-safe:hover:border-steel-500/40 motion-safe:hover:shadow-lg">
        <Image
          src={category.imageUrl ?? "https://placehold.co/600x400/1e3a8a/ffffff?text=Category"}
          alt={category.name}
          width={600}
          height={400}
          className="h-36 w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
        />
        <div className="space-y-1 p-4">
          <h3 className="font-display text-xl font-semibold uppercase tracking-[0.05em] text-iron-800">
            {category.name}
          </h3>
          <p className="font-mono text-xs tracking-[0.03em] text-steel-500">
            {category._count?.products ?? 0} products
          </p>
        </div>
      </article>
    </Link>
  );
}
