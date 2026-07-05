import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DUMMY_HASH = bcrypt.hashSync("delta-mill-store-auth-dummy-password", 10);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      id: "admin",
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const user = await prisma.adminUser.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          await bcrypt.compare(credentials.password, DUMMY_HASH);
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );
        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name ?? user.username,
          email: user.email,
          username: user.username,
          userType: "admin",
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "customer",
      name: "Customer",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        const normalizedEmail = credentials.email.toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          await bcrypt.compare(credentials.password, DUMMY_HASH);
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );
        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: "customer",
          role: "customer",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.userType = user.userType;
        token.role = user.role;
        token.username =
          user.userType === "admin" ? user.username ?? null : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string | null | undefined;
        session.user.name = token.name as string | null | undefined;
        session.user.userType = token.userType as "admin" | "customer";
        session.user.role = token.role as AdminRole | "customer";
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
};
