"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { CustomerSessionProvider } from "@/components/storefront/customer-session-provider";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Toaster } from "@/components/ui/toast";
import { CompareBar } from "@/components/storefront/compare-toggle";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            className="min-h-[70vh]"
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={pageTransition}
          >
            {children}
          </motion.main>
        </AnimatePresence>
        <SiteFooter />
        <CartDrawer />
        <CompareBar />
        <Toaster />
      </CartProvider>
    </CustomerSessionProvider>
  );
}
