import Link from "next/link";

type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 text-xs text-steel-500">
      {items.map((item, index) => (
        <div className="flex items-center gap-1" key={`${item.label}-${index}`}>
          {item.href ? (
            <Link href={item.href} className="hover:text-iron-800">
              {item.label}
            </Link>
          ) : (
            <span className="text-iron-800">{item.label}</span>
          )}
          {index < items.length - 1 ? <span className="px-1">·</span> : null}
        </div>
      ))}
    </div>
  );
}
