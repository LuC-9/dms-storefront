import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .trim()
    .min(7, "Invalid phone number")
    .max(20, "Invalid phone number")
    .optional(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          issues: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  const { name, email, password, phone } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: { code: "EMAIL_EXISTS", message: "Email already in use" } },
        { status: 409 },
      );
    }
    throw error;
  }
}
