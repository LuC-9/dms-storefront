"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/orders", label: "Orders" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:block md:space-y-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block border-b-2 px-3 py-2 text-sm whitespace-nowrap ${
              active
                ? "border-safety-orange font-display font-semibold uppercase tracking-[0.05em] text-iron-800"
                : "border-transparent text-steel-500 hover:text-iron-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
