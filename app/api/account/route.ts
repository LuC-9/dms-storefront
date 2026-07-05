import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";
import { AccountUpdateSchema } from "@/lib/validators";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!user) {
    return errorResponse("NOT_FOUND", "User not found", 404);
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  let payload: z.infer<typeof AccountUpdateSchema>;
  try {
    payload = AccountUpdateSchema.parse(await request.json().catch(() => null));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            issues: error.issues,
          },
        },
        { status: 400 },
      );
    }
    throw error;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json(user);
}
