import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const now = new Date();

  // Purge expired enquiries on every admin read — no cron job needed.
  await prisma.enquiry.deleteMany({ where: { expiresAt: { lt: now } } });

  const enquiries = await prisma.enquiry.findMany({
    where: { expiresAt: { gte: now } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ enquiries });
}
