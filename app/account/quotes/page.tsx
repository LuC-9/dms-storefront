import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireCustomerSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/utils";
import type { QuoteStatus } from "@prisma/client";

const STATUS_STYLES: Record<QuoteStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  QUOTED: "bg-blue-100 text-blue-800 border-blue-300",
  ACCEPTED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  EXPIRED: "bg-steel-100 text-steel-500 border-steel-300",
};

export default async function AccountQuotesPage() {
  const session = await requireCustomerSession();
  if (!session) redirect("/login?callbackUrl=/account/quotes");

  const quotes = await prisma.quoteRequest.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { category: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="border border-steel-500/25 bg-alloy-white p-4">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-safety-orange" />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.05em]">Quote Requests</h1>
          <p className="text-sm text-steel-500">Track your custom price requests.</p>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="mt-6 border border-steel-500/30 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-steel-300" />
          <p className="mt-3 font-display text-xl font-semibold text-iron-800">No quote requests yet</p>
          <p className="mt-1 text-sm text-steel-500">Request custom pricing from a product page.</p>
          <Link
            href="/catalogue"
            className="mt-4 inline-block border border-safety-orange bg-safety-orange px-5 py-2 font-display text-sm font-semibold uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
          >
            Browse catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {quotes.map((quote) => (
            <article key={quote.id} className="border border-steel-500/25 bg-white">
              <div className="flex gap-4 p-4">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden bg-blueprint-100">
                  <Image src={quote.product.imageUrl} alt={quote.product.name} fill className="object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-steel-500">
                        {quote.product.category?.name ?? "Industrial"}
                      </p>
                      <h3 className="font-display text-base font-semibold leading-tight text-iron-800">
                        <Link href={`/products/${quote.product.slug}`} className="hover:underline">
                          {quote.product.name}
                        </Link>
                      </h3>
                    </div>
                    <span
                      className={`inline-flex border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] ${STATUS_STYLES[quote.status]}`}
                    >
                      {quote.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-steel-500">
                    <span>Qty: <span className="font-semibold text-iron-800">{quote.quantity}</span></span>
                    <span>
                      Submitted:{" "}
                      <span className="font-semibold text-iron-800">
                        {new Date(quote.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </span>
                    {quote.deliveryDate && (
                      <span>
                        Delivery by:{" "}
                        <span className="font-semibold text-iron-800">
                          {new Date(quote.deliveryDate).toLocaleDateString("en-IN")}
                        </span>
                      </span>
                    )}
                  </div>

                  {quote.status === "QUOTED" && quote.quotedPrice !== null && (
                    <div className="mt-1 rounded-sm border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                      <p className="font-semibold text-iron-800">
                        Quoted price: {formatInr(quote.quotedPrice)}
                      </p>
                      {quote.adminNotes && (
                        <p className="mt-0.5 text-xs text-steel-600">Admin notes: {quote.adminNotes}</p>
                      )}
                    </div>
                  )}

                  {quote.notes && (
                    <p className="text-xs text-steel-500">
                      Your note: <span className="italic">&quot;{quote.notes}&quot;</span>
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
