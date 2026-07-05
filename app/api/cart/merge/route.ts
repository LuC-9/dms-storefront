import { NextResponse } from "next/server";
import { mergeGuestCart } from "@/lib/cart";
import { requireCustomerSession } from "@/lib/rbac";
import { GuestCartMergeSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/api";

export async function POST(request: Request) {
  const session = await requireCustomerSession();
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = GuestCartMergeSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid cart payload", 400);
  }

  const result = await mergeGuestCart({
    userId: session.user.id,
    guestItems: parsed.data.items,
  });

  return NextResponse.json(result);
}
