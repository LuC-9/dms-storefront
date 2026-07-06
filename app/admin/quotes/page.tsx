import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { formatInr } from "@/lib/utils";
import { QuoteRespondForm } from "@/components/admin/quote-respond-form";

const QUOTE_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  QUOTED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-steel-100 text-steel-600",
};

function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={QUOTE_STATUS_STYLES[status] ?? "bg-steel-100 text-steel-600"}>
      {status}
    </Badge>
  );
}

export default async function AdminQuotesPage() {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN", "MANAGER");
  if (!session) notFound();

  const quotes = await prisma.quoteRequest.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quotes</h1>

      {quotes.length === 0 ? (
        <p className="rounded-md border border-steel-200 bg-white px-4 py-8 text-center text-sm text-steel-500">
          No quote requests yet.
        </p>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const requesterName = quote.user?.name ?? quote.guestName ?? "—";
            const requesterEmail = quote.user?.email ?? quote.guestEmail ?? "—";

            return (
              <div
                key={quote.id}
                className="rounded-md border border-steel-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: requester + product info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <QuoteStatusBadge status={quote.status} />
                      <span className="font-medium text-steel-900">{requesterName}</span>
                      <span className="text-sm text-steel-500">{requesterEmail}</span>
                    </div>

                    <div className="text-sm text-steel-700">
                      Product:{" "}
                      <Link
                        href={`/admin/products/${quote.product.id}/edit`}
                        className="font-medium text-primary hover:underline"
                      >
                        {quote.product.name}
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-steel-600">
                      <span>Qty: <strong>{quote.quantity}</strong></span>
                      {quote.deliveryDate && (
                        <span>
                          Delivery: <strong>{new Date(quote.deliveryDate).toLocaleDateString("en-IN")}</strong>
                        </span>
                      )}
                      <span>
                        Requested: <strong>{new Date(quote.createdAt).toLocaleDateString("en-IN")}</strong>
                      </span>
                    </div>

                    {quote.notes && (
                      <p className="text-sm text-steel-500 italic">
                        &ldquo;{quote.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Right: quoted price + admin notes */}
                  <div className="text-right text-sm">
                    {quote.quotedPrice != null && (
                      <p className="font-semibold text-steel-900">
                        Quoted: {formatInr(quote.quotedPrice)}
                      </p>
                    )}
                    {quote.adminNotes && (
                      <p className="mt-1 max-w-xs text-steel-500 text-xs">{quote.adminNotes}</p>
                    )}
                    {quote.respondedAt && (
                      <p className="mt-1 text-xs text-steel-400">
                        Responded {new Date(quote.respondedAt).toLocaleDateString("en-IN")}
                        {quote.respondedBy ? ` by ${quote.respondedBy}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 border-t border-steel-100 pt-3">
                  <QuoteRespondForm quoteId={quote.id} currentStatus={quote.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
