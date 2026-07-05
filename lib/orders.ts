import type { Address, Order } from "@prisma/client";
import { z } from "zod";

export type AddressSnapshot = {
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
};

const AddressSnapshotSchema = z.object({
  label: z.string().nullable(),
  fullName: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
});

type ComputeTotalsInput = {
  items: Array<{
    quantity: number;
    unitPriceInPaise: number;
  }>;
  shippingInPaise: number;
  taxInPaise: number;
};

const ORDER_NUMBER_PREFIX = "DMS";
const ORDER_NUMBER_TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ORDER_NUMBER_TOKEN_LENGTH = 5;

function formatDateParts(date: Date) {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

function randomToken(length: number) {
  let token = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * ORDER_NUMBER_TOKEN_CHARS.length);
    token += ORDER_NUMBER_TOKEN_CHARS[randomIndex];
  }
  return token;
}

export function generateOrderNumber(date = new Date()): string {
  return `${ORDER_NUMBER_PREFIX}-${formatDateParts(date)}-${randomToken(ORDER_NUMBER_TOKEN_LENGTH)}`;
}

export async function generateOrderNumberWithRetry(
  exists: (orderNumber: string) => Promise<boolean>,
  maxRetries = 3,
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const orderNumber = generateOrderNumber();
    const collides = await exists(orderNumber);
    if (!collides) {
      return orderNumber;
    }
  }

  throw new Error("Unable to generate unique order number");
}

export function computeOrderTotals({
  items,
  shippingInPaise,
  taxInPaise,
}: ComputeTotalsInput): {
  subtotalInPaise: number;
  totalInPaise: number;
} {
  const subtotalInPaise = items.reduce((sum, item) => {
    return sum + item.unitPriceInPaise * item.quantity;
  }, 0);

  const totalInPaise = subtotalInPaise + shippingInPaise + taxInPaise;
  return { subtotalInPaise, totalInPaise };
}

export function snapshotAddress(address: Pick<
  Address,
  "label" | "fullName" | "phone" | "line1" | "line2" | "city" | "state" | "pincode"
>): AddressSnapshot {
  return {
    label: address.label ?? null,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
}

export function parseOrderAddress(order: Pick<Order, "shippingAddressJson">): AddressSnapshot {
  const parsed = JSON.parse(order.shippingAddressJson) as unknown;
  const validated = AddressSnapshotSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("Invalid order address snapshot");
  }

  return validated.data;
}
