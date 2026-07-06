import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EnquirySchema } from "@/lib/validators";

const RETENTION_DAYS = 30;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const parsed = EnquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 422 },
    );
  }

  const { name, company, phone, message } = parsed.data;
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);

  // Save enquiry and purge any expired ones in a single transaction.
  const [enquiry] = await prisma.$transaction([
    prisma.enquiry.create({
      data: { name, company, phone, message, expiresAt },
    }),
    prisma.enquiry.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
  ]);

  return NextResponse.json({ id: enquiry.id }, { status: 201 });
}
