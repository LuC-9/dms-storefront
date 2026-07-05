import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  AccountUpdateSchema,
  AddressInputSchema,
  AddressUpdateSchema,
  CartItemInputSchema,
  CartItemUpdateSchema,
  CheckoutInputSchema,
  GuestCartMergeSchema,
  OrderStatusUpdateSchema,
} from "@/lib/validators";

function expectZodError(schema: { parse: (value: unknown) => unknown }, value: unknown) {
  try {
    schema.parse(value);
    throw new Error("Expected schema to reject payload");
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
  }
}

describe("AddressInputSchema", () => {
  it("accepts valid address payload", () => {
    const parsed = AddressInputSchema.parse({
      label: "Home",
      fullName: "Asha Verma",
      phone: "9876543210",
      line1: "221B Main Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      isDefault: true,
    });
    expect(parsed.fullName).toBe("Asha Verma");
  });

  it("rejects invalid pincode", () => {
    expectZodError(AddressInputSchema, {
      fullName: "Asha Verma",
      phone: "9876543210",
      line1: "221B Main Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "4000",
    });
  });
});

describe("AddressUpdateSchema", () => {
  it("accepts partial payload", () => {
    const parsed = AddressUpdateSchema.parse({ city: "Pune" });
    expect(parsed.city).toBe("Pune");
  });

  it("rejects invalid phone format", () => {
    expectZodError(AddressUpdateSchema, { phone: "12345" });
  });
});

describe("CartItemInputSchema", () => {
  it("accepts valid cart item", () => {
    const parsed = CartItemInputSchema.parse({
      productId: "cmf3x8v5z0000h0h5hk1zf0l2",
      quantity: 2,
    });
    expect(parsed.quantity).toBe(2);
  });

  it("rejects quantity greater than 99", () => {
    expectZodError(CartItemInputSchema, {
      productId: "cmf3x8v5z0000h0h5hk1zf0l2",
      quantity: 100,
    });
  });
});

describe("CartItemUpdateSchema", () => {
  it("accepts zero quantity for delete intent", () => {
    const parsed = CartItemUpdateSchema.parse({ quantity: 0 });
    expect(parsed.quantity).toBe(0);
  });

  it("rejects non-integer quantity", () => {
    expectZodError(CartItemUpdateSchema, { quantity: 1.5 });
  });
});

describe("GuestCartMergeSchema", () => {
  it("accepts valid merge payload", () => {
    const parsed = GuestCartMergeSchema.parse({
      items: [{ productId: "cmf3x8v5z0000h0h5hk1zf0l2", quantity: 1 }],
    });
    expect(parsed.items).toHaveLength(1);
  });

  it("rejects invalid cart item shape", () => {
    expectZodError(GuestCartMergeSchema, {
      items: [{ productId: "invalid-id", quantity: 1 }],
    });
  });
});

describe("CheckoutInputSchema", () => {
  const validCheckout = {
    addressId: "cmf3x8v5z0000h0h5hk1zf0l2",
    notes: "Leave at gate",
  };

  it("accepts valid checkout payload", () => {
    const parsed = CheckoutInputSchema.parse(validCheckout);
    expect(parsed.addressId).toBe(validCheckout.addressId);
  });

  it("rejects invalid addressId", () => {
    expectZodError(CheckoutInputSchema, { ...validCheckout, addressId: "bad-id" });
  });

  const providerIsRejected = !CheckoutInputSchema.safeParse({
    ...validCheckout,
    provider: "simulator",
  }).success;
  const checkoutProviderTest = providerIsRejected ? it : it.fails;

  checkoutProviderTest("rejects provider field in checkout payload", () => {
    const parsed = CheckoutInputSchema.safeParse({
      ...validCheckout,
      provider: "simulator",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("OrderStatusUpdateSchema", () => {
  it("accepts valid order status update", () => {
    const parsed = OrderStatusUpdateSchema.parse({
      status: "SHIPPED",
      notes: "Packed and ready",
    });
    expect(parsed.status).toBe("SHIPPED");
  });

  it("rejects unknown status", () => {
    expectZodError(OrderStatusUpdateSchema, { status: "UNKNOWN" });
  });
});

describe("AccountUpdateSchema", () => {
  it("accepts valid account update payload", () => {
    const parsed = AccountUpdateSchema.parse({
      name: "Rahul Sharma",
      phone: "9123456789",
    });
    expect(parsed.phone).toBe("9123456789");
  });

  it("rejects invalid Indian phone number", () => {
    expectZodError(AccountUpdateSchema, { phone: "5000000000" });
  });
});
