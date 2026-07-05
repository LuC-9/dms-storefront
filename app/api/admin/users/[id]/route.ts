import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";

const UpdateAdminSchema = z
  .object({
    role: z.nativeEnum(AdminRole).optional(),
    name: z.string().trim().max(100).nullable().optional(),
    email: z.string().trim().email().nullable().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function ensureNotLastSuperAdmin(targetUserId: string, nextRole?: AdminRole) {
  const target = await prisma.adminUser.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });
  if (!target) {
    return { ok: false as const, reason: "NOT_FOUND" };
  }

  const losingSuperAdmin = target.role === "SUPER_ADMIN" && nextRole !== "SUPER_ADMIN";
  if (!losingSuperAdmin) {
    return { ok: true as const };
  }

  const totalSuperAdmins = await prisma.adminUser.count({
    where: { role: "SUPER_ADMIN" },
  });

  if (totalSuperAdmins <= 1) {
    return { ok: false as const, reason: "LAST_SUPER_ADMIN" };
  }
  return { ok: true as const };
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession("SUPER_ADMIN");
  if (!session) {
    return errorResponse("FORBIDDEN", "SUPER_ADMIN role required", 403);
  }

  const { id } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = UpdateAdminSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid admin payload", 400);
  }

  const roleCheck = await ensureNotLastSuperAdmin(id, parsed.data.role);
  if (!roleCheck.ok) {
    if (roleCheck.reason === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", "Admin user not found", 404);
    }
    return errorResponse("LAST_SUPER_ADMIN", "Cannot demote the last SUPER_ADMIN", 409);
  }

  const data: {
    role?: AdminRole;
    name?: string | null;
    email?: string | null;
    passwordHash?: string;
  } = {};

  if (parsed.data.role) {
    data.role = parsed.data.role;
  }
  if ("name" in parsed.data) {
    data.name = parsed.data.name ?? null;
  }
  if ("email" in parsed.data) {
    data.email = parsed.data.email ? parsed.data.email.toLowerCase() : null;
  }
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      return tx.adminUser.update({
        where: { id },
        data,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return errorResponse("DUPLICATE_ADMIN", "Username or email already exists", 409);
    }
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return errorResponse("NOT_FOUND", "Admin user not found", 404);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession("SUPER_ADMIN");
  if (!session) {
    return errorResponse("FORBIDDEN", "SUPER_ADMIN role required", 403);
  }

  const { id } = await context.params;
  const roleCheck = await ensureNotLastSuperAdmin(id, "ADMIN");
  if (!roleCheck.ok) {
    if (roleCheck.reason === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", "Admin user not found", 404);
    }
    return errorResponse("LAST_SUPER_ADMIN", "Cannot delete the last SUPER_ADMIN", 409);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { assignedAdminId: id },
        data: { assignedAdminId: null },
      });
      await tx.adminUser.delete({ where: { id } });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return errorResponse("NOT_FOUND", "Admin user not found", 404);
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
