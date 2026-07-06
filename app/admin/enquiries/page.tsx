import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const session = await requireAdminSession("SUPER_ADMIN", "ADMIN", "MANAGER");
  if (!session) notFound();

  const now = new Date();

  // Purge expired records before fetching.
  await prisma.enquiry.deleteMany({ where: { expiresAt: { lt: now } } });

  const enquiries = await prisma.enquiry.findMany({
    where: { expiresAt: { gte: now } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enquiries</h1>
          <p className="mt-1 text-sm text-steel-500">
            Contact form submissions — auto-deleted 30 days after receipt.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {enquiries.length} active
        </span>
      </div>

      {enquiries.length === 0 ? (
        <div className="rounded border border-steel-200 bg-white p-10 text-center text-sm text-steel-500">
          No enquiries yet. Submissions from the contact form will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((enquiry) => {
            const daysLeft = Math.ceil(
              (enquiry.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            return (
              <div
                key={enquiry.id}
                className="rounded border border-steel-200 bg-white p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-iron-800">{enquiry.name}</p>
                    {enquiry.company && (
                      <p className="text-sm text-steel-500">{enquiry.company}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-steel-400">
                    <span className="font-mono">{enquiry.phone}</span>
                    <span>·</span>
                    <span title={enquiry.createdAt.toISOString()}>
                      {formatDistanceToNow(enquiry.createdAt)} ago
                    </span>
                    <span>·</span>
                    <span
                      className={daysLeft <= 5 ? "text-safety-orange font-medium" : ""}
                      title={`Expires ${enquiry.expiresAt.toLocaleDateString()}`}
                    >
                      {daysLeft}d until deletion
                    </span>
                  </div>
                </div>
                <p className="text-sm text-steel-600 whitespace-pre-wrap">{enquiry.message}</p>
                <p className="font-mono text-[0.65rem] uppercase tracking-wide text-steel-300">
                  ID: {enquiry.id}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
