"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/components/storefront/cart-context";
import { SearchDialog } from "@/components/storefront/search-dialog";

const links = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartAnimated, setCartAnimated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { itemCount, toggleDrawer } = useCart();
  const isCustomer = session?.user?.userType === "customer";

  useEffect(() => {
    const onCartAdded = () => {
      setCartAnimated(true);
      window.setTimeout(() => setCartAnimated(false), 450);
    };
    window.addEventListener("cart:item-added", onCartAdded);
    return () => window.removeEventListener("cart:item-added", onCartAdded);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const authWidget =
    status === "loading" ? null : isCustomer ? (
      <div className="relative">
        <Button
          variant="ghost"
          className="h-9 rounded-none border border-steel-500/40 px-3 text-xs font-medium uppercase tracking-[0.05em] text-alloy-white hover:bg-forge-950"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {session.user.name ?? session.user.email ?? "My account"}
        </Button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" as const }}
              className="absolute right-0 top-full z-40 mt-2 min-w-44 border border-steel-500 bg-alloy-white p-1"
            >
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-blueprint-100"
                onClick={() => { setMenuOpen(false); router.push("/account/orders"); }}
              >
                My orders
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-blueprint-100"
                onClick={() => { setMenuOpen(false); router.push("/account"); }}
              >
                Profile
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-safety-orange hover:bg-blueprint-100"
                onClick={() => { setMenuOpen(false); void signOut({ callbackUrl: "/" }); }}
              >
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ) : status === "unauthenticated" ? (
      <div className="hidden items-center gap-2 md:flex">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-none text-alloy-white hover:bg-forge-950"
        >
          <Link href="/login">Sign in</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
        >
          <Link href="/register">Create account</Link>
        </Button>
      </div>
    ) : null;

  return (
    <motion.header
      className="sticky top-0 z-40 border-b bg-iron-800 transition-[border-color,box-shadow] duration-300"
      style={{
        borderBottomColor: scrolled ? "rgba(69,99,122,0.5)" : "rgba(69,99,122,0.3)",
        boxShadow: scrolled ? "0 4px 24px -4px rgba(13,27,42,0.45)" : "none",
      }}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number]  }}
    >
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg font-bold uppercase tracking-[0.06em] text-alloy-white transition-colors hover:text-safety-orange"
        >
          Delta Mill
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative font-medium text-alloy-white hover:text-blueprint-100"
            >
              {link.label}
              {pathname === link.href && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-safety-orange"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {authWidget}
          <SearchDialog />
          <Button
            variant="ghost"
            size="sm"
            className={`relative rounded-none border border-steel-500/40 text-alloy-white hover:bg-forge-950 ${cartAnimated ? "animate-cart-bounce" : ""}`}
            onClick={toggleDrawer}
            aria-label="Open cart"
          >
            <ShoppingBag className="h-4 w-4" />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-safety-orange px-1 text-[10px] text-alloy-white"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-none border border-steel-500/40 text-alloy-white hover:bg-forge-950 md:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] border-steel-500 bg-forge-950 text-alloy-white">
              <div className="mt-8 flex flex-col gap-3">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium ${pathname === link.href ? "text-safety-orange" : "text-alloy-white"}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link href="/cart" className="text-sm font-medium text-alloy-white">
                  Cart
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
