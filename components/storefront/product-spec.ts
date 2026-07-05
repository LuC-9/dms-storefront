type SpecInput = {
  sku?: string | null;
  name: string;
  category?: string | null;
};

export function getSkuLabel({ sku, name }: SpecInput) {
  if (sku?.trim()) {
    return sku.trim().toUpperCase();
  }

  const compact = name
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 18);

  return `DMS-${compact || "PART"}`;
}

export function getSpecLabel({ category }: SpecInput) {
  if (!category) {
    return "DN50 · SS304";
  }

  return category.length > 26 ? `${category.slice(0, 23).toUpperCase()}...` : category.toUpperCase();
}
