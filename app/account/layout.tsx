import { redirect } from "next/navigation";
import { requireCustomerSession } from "@/lib/rbac";
import { AccountNav } from "@/components/storefront/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCustomerSession();
  if (!session) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="h-fit border border-steel-500/25 bg-alloy-white p-3">
          <h2 className="mb-3 font-display text-xl font-semibold uppercase tracking-[0.05em] text-iron-800">
            Account
          </h2>
          <AccountNav />
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
