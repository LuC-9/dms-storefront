import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const quotes = await prisma.quoteRequest.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          name: true,
          imageUrl: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotes);
}
