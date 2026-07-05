import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";

const CreateAdminSchema = z.object({
  username: z.string().trim().min(3).max(40),
  password: z.string().min(8),
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().email().optional(),
  role: z.nativeEnum(AdminRole),
});

export async function GET() {
  const session = await requireAdminSession("SUPER_ADMIN");
  if (!session) {
    return errorResponse("FORBIDDEN", "SUPER_ADMIN role required", 403);
  }

  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await requireAdminSession("SUPER_ADMIN");
  if (!session) {
    return errorResponse("FORBIDDEN", "SUPER_ADMIN role required", 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = CreateAdminSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid admin payload", 400);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    const user = await prisma.adminUser.create({
      data: {
        username: parsed.data.username,
        passwordHash,
        name: parsed.data.name,
        email: parsed.data.email?.toLowerCase(),
        role: parsed.data.role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return errorResponse("DUPLICATE_ADMIN", "Username or email already exists", 409);
    }
    throw error;
  }
}
