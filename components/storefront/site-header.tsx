"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, ShoppingBag, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/components/storefront/cart-context";
import { SearchDialog } from "@/components/storefront/search-dialog";
import { SPRING_SNAP } from "@/lib/motion-presets";

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
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const authWidget =
    status === "loading" ? null : isCustomer ? (
      <div className="relative">
        <button
          type="button"
          className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/20"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {session.user.name ?? "Account"}
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-full z-40 mt-2 min-w-44 overflow-hidden rounded-2xl bg-white p-1 shadow-card-hover ring-1 ring-steel-200"
            >
              {[
                { label: "My orders", href: "/account/orders" },
                { label: "Profile", href: "/account" },
              ].map((item) => (
                <button
                  key={item.href}
                  type="button"
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-muted"
                  onClick={() => { setMenuOpen(false); router.push(item.href); }}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-safety-orange hover:bg-surface-muted"
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
        <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10">
          Sign in
        </Link>
        <Link href="/register" className="rounded-full bg-safety-orange px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-600">
          Create account
        </Link>
      </div>
    ) : null;

  return (
    <motion.header
      className="sticky top-0 z-40 bg-iron-800 shadow-header"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="border-b border-steel-500/20 bg-forge-950">
        <div className="container flex items-center justify-between py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-steel-400">
          <span>Kanpur, India · Est. 1987</span>
          <span className="hidden md:inline">B2B wholesale · Grade-certified stock</span>
          <span>Tel 512-2362054</span>
        </div>
      </div>
      <div className="container flex h-16 items-center gap-4 md:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-safety-orange font-display text-sm font-bold text-white">
            D
          </span>
          <div className="hidden sm:block leading-tight">
            <span className="block font-display text-base font-bold uppercase tracking-wide text-white">
              Delta Mills
            </span>
            <span className="block font-mono text-[0.55rem] uppercase tracking-[0.2em] text-steel-400">
              Store
            </span>
          </div>
        </Link>

        {/* Center search — desktop */}
        <div className="hidden flex-1 md:flex md:justify-center">
          <SearchDialog variant="header" />
        </div>

        {/* Promo strip */}
        <p className="hidden items-center gap-1.5 text-xs font-medium text-white/80 lg:flex">
          <Zap className="h-3.5 w-3.5 text-safety-orange" />
          Orders before noon ship same day
        </p>

        <nav className="hidden items-center gap-1 xl:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href ? "text-white" : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white/15"
                  transition={SPRING_SNAP}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="md:hidden">
            <SearchDialog variant="icon" />
          </div>
          {authWidget}
          <button
            type="button"
            onClick={toggleDrawer}
            aria-label="Open cart"
            className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20 ${cartAnimated ? "animate-cart-bounce" : ""}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={SPRING_SNAP}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-safety-orange px-1 text-[10px] font-bold text-white"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20 xl:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] rounded-r-3xl border-0 bg-iron-800 text-white">
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
                      pathname === link.href ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
