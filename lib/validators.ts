import { AttendanceStatus, OrderStatus } from "@prisma/client";
import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  priceInPaise: z.number().int().positive(),
  imageUrl: z.string().url(),
  sku: z.string().optional().nullable(),
  inStock: z.boolean(),
  categoryId: z.string().cuid(),
});

export const employeeSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  address: z.string().min(5),
  joinDate: z.string().datetime().or(z.string().date()),
  baseSalary: z.number().int().positive(),
});

export const salarySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  baseSalary: z.number().int().positive(),
  bonus: z.number().int().min(0).default(0),
  deductions: z.number().int().min(0).default(0),
  netPaid: z.number().int().positive(),
  notes: z.string().optional().nullable(),
});

export const attendanceSchema = z.object({
  date: z.string().datetime().or(z.string().date()),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional().nullable(),
});

const indianMobileRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

export const AddressInputSchema = z.object({
  label: z.string().trim().min(1).max(50).optional(),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(indianMobileRegex, "Invalid phone number"),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(pincodeRegex, "Invalid pincode"),
  isDefault: z.boolean().optional(),
});

export const AddressUpdateSchema = AddressInputSchema.partial();

export const CartItemInputSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
});

export const CartItemUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const GuestCartMergeSchema = z.object({
  items: z.array(CartItemInputSchema),
});

export const CheckoutInputSchema = z.object({
  addressId: z.string().cuid(),
  notes: z.string().trim().max(500).optional(),
});

export const AccountUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/).optional(),
}).strict();

export const OrderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().trim().max(1000).optional(),
  trackingUrl: z.string().trim().url().max(1000).optional(),
});

export const OrderCancelSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const AdminRefundSchema = z.object({
  type: z.enum(["FULL", "PARTIAL"]),
  amountInPaise: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1000),
  cancelOrder: z.boolean(),
});

export const StockNotificationSchema = z.object({
  email: z.string().trim().email().optional(),
  productId: z.string().cuid(),
});

export function apiError(code: string, message: string, status: number) {
  return {
    status,
    body: {
      error: {
        code,
        message,
      },
    },
  };
}
