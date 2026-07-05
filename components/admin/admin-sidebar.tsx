"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutGrid, Package, ShoppingBag, Tags, Users, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/lib/rbac";

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const roleNavigation: Record<AdminRole, AdminNavItem[]> = {
  SUPER_ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutGrid },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/employees", label: "Employees", icon: UserRound },
    { href: "/admin/users", label: "Admin Users", icon: Users },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutGrid },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/employees", label: "Employees", icon: UserRound },
  ],
  MANAGER: [
    { href: "/admin", label: "Dashboard", icon: LayoutGrid },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/employees", label: "Employees", icon: UserRound },
  ],
  EMPLOYEE: [{ href: "/admin/orders/mine", label: "My Orders", icon: ShoppingBag }],
};

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  if (href === "/admin/orders/mine") return pathname.startsWith("/admin/orders/mine");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const role =
    data?.user?.userType === "admin" && data.user.role !== "customer" ? data.user.role : null;
  const links = role ? roleNavigation[role] : [];

  return (
    <aside className="w-full border-r border-steel-200 bg-white md:w-64">
      <div className="border-b border-steel-200 p-4">
        <h2 className="text-lg font-semibold text-primary">Admin Panel</h2>
      </div>
      <nav className="space-y-1 p-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = isActivePath(pathname, link.href);
          return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              isActive ? "bg-primary text-white" : "text-steel-700 hover:bg-steel-100",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{link.label}</span>
          </Link>
          );
        })}
      </nav>
    </aside>
  );
}
