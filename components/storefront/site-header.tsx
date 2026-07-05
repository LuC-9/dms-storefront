"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, ShoppingBag } from "lucide-react";
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
        {menuOpen ? (
          <div className="absolute right-0 top-full z-40 mt-2 min-w-44 border border-steel-500 bg-alloy-white p-1">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-blueprint-100"
              onClick={() => {
                setMenuOpen(false);
                router.push("/account/orders");
              }}
            >
              My orders
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-blueprint-100"
              onClick={() => {
                setMenuOpen(false);
                router.push("/account");
              }}
            >
              Profile
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-safety-orange hover:bg-blueprint-100"
              onClick={() => {
                setMenuOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    ) : status === "unauthenticated" ? (
      <div className="hidden items-center gap-2 md:flex">
        <Button asChild variant="ghost" size="sm" className="rounded-none text-alloy-white hover:bg-forge-950">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white"
        >
          <Link href="/register">Create account</Link>
        </Button>
      </div>
    ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-steel-500/30 bg-iron-800">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold uppercase tracking-[0.05em] text-alloy-white">
          Delta Mill
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium ${
                pathname === link.href ? "text-safety-orange" : "text-alloy-white hover:text-blueprint-100"
              }`}
            >
              {link.label}
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
            {itemCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 animate-[badge-pop_120ms_ease-out] items-center justify-center rounded-full bg-safety-orange px-1 text-[10px] text-alloy-white">
                {itemCount}
              </span>
            ) : null}
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
    </header>
  );
}
