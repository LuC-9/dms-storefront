import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { Price } from "@/components/storefront/price";
import { SpecPlate } from "@/components/storefront/spec-plate";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const session = await requireCustomerSession();
  if (!session) {
    redirect("/login?callbackUrl=/account/orders");
  }

  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const address = JSON.parse(order.shippingAddressJson) as {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };

  return (
    <div className="container space-y-8 py-8 md:py-12">
      <section className="space-y-4 border border-steel-500 bg-forge-950 p-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em] text-alloy-white">
          Order confirmed
        </h1>
        <SpecPlate lines={[`ORDER ${order.orderNumber}`]} className="inline-flex" />
        <p className="text-sm text-blueprint-100">We'll dispatch within 2-3 working days.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="border border-safety-orange bg-safety-orange px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white"
          >
            View my orders
          </Link>
          <Link
            href="/catalogue"
            className="border border-alloy-white px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white"
          >
            Continue shopping
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="border border-steel-500/25 bg-alloy-white p-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Order summary</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-steel-500/20 pb-2 text-sm">
                <p>
                  {item.productNameSnapshot} x {item.quantity}
                </p>
                <Price valueInPaise={item.lineTotalInPaise} />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-steel-500">Subtotal</span>
              <Price valueInPaise={order.subtotalInPaise} />
            </div>
            <div className="flex justify-between">
              <span className="text-steel-500">Shipping</span>
              <Price valueInPaise={order.shippingInPaise} />
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <Price valueInPaise={order.totalInPaise} />
            </div>
          </div>
        </div>
        <aside className="space-y-4 border border-steel-500/25 bg-alloy-white p-4">
          <div>
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Delivery address</h2>
            <p className="mt-2 text-sm text-steel-500">
              {address.fullName}
              <br />
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} - {address.pincode}
              <br />
              {address.phone}
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.05em]">Payment</h2>
            <p className="mt-2 font-mono text-sm tracking-[0.03em] text-steel-500">{order.paymentStatus}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
