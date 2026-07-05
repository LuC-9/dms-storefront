"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { CustomerSessionProvider } from "@/components/storefront/customer-session-provider";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Toaster } from "@/components/ui/toast";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <CustomerSessionProvider>
      <CartProvider>
        <SiteHeader />
        <main key={pathname} className="min-h-[70vh] animate-page-enter motion-reduce:animate-none">
          {children}
        </main>
        <SiteFooter />
        <CartDrawer />
        <Toaster />
      </CartProvider>
    </CustomerSessionProvider>
  );
}
