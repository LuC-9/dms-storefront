import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/api";
import { QuoteStatusUpdateSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/email";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;

  let payload: z.infer<typeof QuoteStatusUpdateSchema>;
  try {
    payload = QuoteStatusUpdateSchema.parse(await request.json().catch(() => null));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid request body", issues: error.issues } },
        { status: 400 },
      );
    }
    throw error;
  }

  const existing = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      product: { select: { name: true } },
    },
  });

  if (!existing) {
    return errorResponse("NOT_FOUND", "Quote request not found", 404);
  }

  const updated = await prisma.quoteRequest.update({
    where: { id },
    data: {
      status: payload.status,
      quotedPrice: payload.quotedPrice,
      adminNotes: payload.adminNotes,
      respondedAt: new Date(),
      respondedBy: session.user.username ?? session.user.name ?? session.user.id,
    },
  });

  const recipientEmail = existing.user?.email ?? existing.guestEmail;
  const recipientName = existing.user?.name ?? existing.guestName ?? "Valued Customer";

  if (recipientEmail) {
    const statusLabels: Record<string, string> = {
      QUOTED: "Quoted",
      ACCEPTED: "Accepted",
      REJECTED: "Rejected",
      EXPIRED: "Expired",
    };
    const statusLabel = statusLabels[payload.status] ?? payload.status;

    const priceHtml =
      payload.quotedPrice != null
        ? `<p>Quoted Price: <strong>₹${(payload.quotedPrice / 100).toFixed(2)}</strong></p>`
        : "";

    const adminNotesHtml = payload.adminNotes
      ? `<p>Notes from our team: ${payload.adminNotes}</p>`
      : "";

    sendEmail({
      to: recipientEmail,
      subject: `Quote Update: ${statusLabel} — ${existing.product.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1f2937">Quote Request Update — Delta Mill Stores</h2>
          <p>Hello ${recipientName},</p>
          <p>Your quote request for <strong>${existing.product.name}</strong> has been updated to <strong>${statusLabel}</strong>.</p>
          ${priceHtml}
          ${adminNotesHtml}
          <p>Reference ID: <strong>${id}</strong></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">Delta Mill Stores — Industrial Hardware B2B</p>
        </div>
      `,
    }).catch((err: unknown) => {
      console.error("[quotes/[id]] notification email failed:", err);
    });
  }

  return NextResponse.json(updated);
}
