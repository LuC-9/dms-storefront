import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/rbac";
import { errorResponse } from "@/lib/api";
import { QuoteRequestSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await requireCustomerSession();

  let payload: z.infer<typeof QuoteRequestSchema>;
  try {
    payload = QuoteRequestSchema.parse(await request.json().catch(() => null));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid request body", issues: error.issues } },
        { status: 400 },
      );
    }
    throw error;
  }

  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
    select: { id: true, name: true },
  });
  if (!product) {
    return errorResponse("NOT_FOUND", "Product not found", 404);
  }

  const quote = await prisma.quoteRequest.create({
    data: {
      productId: payload.productId,
      quantity: payload.quantity,
      deliveryDate: payload.deliveryDate ? new Date(payload.deliveryDate) : null,
      notes: payload.notes,
      guestName: payload.guestName,
      guestEmail: payload.guestEmail,
      guestPhone: payload.guestPhone,
      ...(session ? { userId: session.user.id } : {}),
    },
  });

  const recipientEmail = session?.user.email ?? payload.guestEmail;
  const recipientName = session?.user.name ?? payload.guestName ?? "Valued Customer";

  if (recipientEmail) {
    sendEmail({
      to: recipientEmail,
      subject: `Quote Request Received — ${product.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1f2937">Quote Request Received — Delta Mills Store</h2>
          <p>Hello ${recipientName},</p>
          <p>We have received your quote request for <strong>${product.name}</strong> (qty: ${payload.quantity}).</p>
          <p>Our team will review your request and get back to you shortly with a price quote.</p>
          <p>Reference ID: <strong>${quote.id}</strong></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">Delta Mills Store — Industrial Hardware B2B</p>
        </div>
      `,
    }).catch((err: unknown) => {
      console.error("[quotes] confirmation email failed:", err);
    });
  }

  return NextResponse.json({ id: quote.id }, { status: 201 });
}
