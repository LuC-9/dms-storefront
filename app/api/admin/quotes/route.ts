import { NextRequest, NextResponse } from "next/server";
import { QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const validStatuses = new Set(Object.values(QuoteStatus));
  const status =
    statusParam && validStatuses.has(statusParam as QuoteStatus)
      ? (statusParam as QuoteStatus)
      : undefined;

  const quotes = await prisma.quoteRequest.findMany({
    where: status ? { status } : {},
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotes);
}
