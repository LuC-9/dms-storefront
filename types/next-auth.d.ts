import "next-auth";
import "next-auth/jwt";
import type { AdminRole } from "@prisma/client";

type AppUserType = "customer" | "admin";
type AppRole = AdminRole | "customer";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      userType: AppUserType;
      role: AppRole;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    username?: string;
    userType: AppUserType;
    role: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    username?: string | null;
    userType: AppUserType;
    role: AppRole;
  }
}
