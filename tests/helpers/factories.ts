import type {
  AdminRole,
  AdminUser,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  Product,
  Refund,
  RefundStatus,
  RefundType,
  User,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { testDb } from "@/tests/helpers/db";

function unique(value: string) {
  return `${value}-${randomUUID()}`;
}

export async function createUser(input?: { email?: string }): Promise<User> {
  const email = input?.email ?? `${unique("user")}@example.com`;
  return testDb.user.create({
    data: {
      name: "Test User",
      email,
      passwordHash: "test-password-hash",
    },
  });
}

export async function createAdmin(input: { role: AdminRole }): Promise<AdminUser> {
  return testDb.adminUser.create({
    data: {
      username: unique("admin"),
      passwordHash: "test-password-hash",
      role: input.role,
      name: "Admin User",
      email: `${unique("admin")}@example.com`,
    },
  });
}

export async function createProduct(input?: { priceInPaise?: number }): Promise<Product> {
  const category = await testDb.category.create({
    data: {
      name: unique("Category"),
      slug: unique("category").toLowerCase(),
      description: "Test category",
      imageUrl: "https://example.com/category.png",
    },
  });

  return testDb.product.create({
    data: {
      name: unique("Product"),
      slug: unique("product").toLowerCase(),
      description: "Product for testing refunds",
      priceInPaise: input?.priceInPaise ?? 5_000,
      imageUrl: "https://example.com/product.png",
      sku: unique("SKU"),
      inStock: true,
      categoryId: category.id,
    },
  });
}

export async function createOrder(input: {
  userId: string;
  status?: OrderStatus;
  totalInPaise?: number;
  withPayment?: "COMPLETED" | "PENDING" | null;
}): Promise<{ order: Order; payment: Payment | null }> {
  const totalInPaise = input.totalInPaise ?? 10_000;
  const order = await testDb.order.create({
    data: {
      orderNumber: unique("ORD"),
      userId: input.userId,
      status: input.status ?? "PENDING",
      subtotalInPaise: totalInPaise,
      shippingInPaise: 0,
      taxInPaise: 0,
      totalInPaise,
      paymentStatus: input.withPayment === "COMPLETED" ? "COMPLETED" : "PENDING",
      shippingAddressJson: JSON.stringify({
        fullName: "Test Customer",
        line1: "123 Test Street",
        city: "Test City",
        state: "Test State",
        pincode: "400001",
      }),
    },
  });

  if (!input.withPayment) {
    return { order, payment: null };
  }

  const paymentStatus = input.withPayment as PaymentStatus;
  const payment = await testDb.payment.create({
    data: {
      orderId: order.id,
      provider: "test-provider",
      amountInPaise: totalInPaise,
      currency: "INR",
      status: paymentStatus,
    },
  });

  return { order, payment };
}

export async function createRefund(input: {
  orderId: string;
  amountInPaise: number;
  status?: RefundStatus;
  type?: RefundType;
  paymentId?: string | null;
  createdAt?: Date;
}): Promise<Refund> {
  return testDb.refund.create({
    data: {
      orderId: input.orderId,
      paymentId: input.paymentId ?? null,
      amountInPaise: input.amountInPaise,
      status: input.status ?? "PENDING",
      type: input.type ?? "PARTIAL",
      reason: "Test refund",
      initiatedBy: "test-suite",
      createdAt: input.createdAt,
    },
  });
}
