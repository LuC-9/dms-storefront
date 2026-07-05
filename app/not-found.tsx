import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container space-y-4 py-12">
      <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Page not found</h1>
      <p className="text-sm text-steel-500">
        This page doesn&apos;t exist. Browse the catalogue or go back.
      </p>
      <div className="flex gap-3">
        <Link
          href="/catalogue"
          className="border border-safety-orange bg-safety-orange px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white"
        >
          Browse catalogue
        </Link>
        <Link
          href="/"
          className="border border-forge-950 px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-forge-950"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}
