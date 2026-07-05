import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email"),
});

const neutralResponse = {
  ok: true,
  message:
    "If an account exists for that email, password reset instructions will be sent.",
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(neutralResponse);
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(neutralResponse);
  }

  const now = new Date();
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: now },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
    console.log("[dev-reset-link] ", resetUrl);
  }

  return NextResponse.json(neutralResponse);
}
