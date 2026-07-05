import { requireCustomerSession } from "@/lib/rbac";
import { PublicTrackOrder } from "@/components/storefront/public-track-order";

export default async function PublicTrackOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const session = await requireCustomerSession();

  return (
    <div className="container py-8 md:py-12">
      <PublicTrackOrder
        orderNumber={orderNumber}
        initialEmail={session?.user?.email ?? ""}
        signedIn={Boolean(session)}
      />
    </div>
  );
}
