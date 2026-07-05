import Link from "next/link";

export default function OrderConfirmationLandingPage() {
  return (
    <div className="container space-y-6 py-8 md:py-12">
      <section className="space-y-3 border border-steel-500 bg-forge-950 p-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em] text-alloy-white">
          Order confirmed
        </h1>
        <p className="text-sm text-blueprint-100">We'll dispatch within 2-3 working days.</p>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="border border-safety-orange bg-safety-orange px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white"
        >
          View my orders
        </Link>
        <Link
          href="/catalogue"
          className="border border-forge-950 px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-forge-950"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
