import { beforeEach, describe, expect, it, vi } from "vitest";

type MockProduct = { id: string; inStock: boolean };
type MockCartItem = { id: string; cartId: string; productId: string; quantity: number };

const state = vi.hoisted(() => ({
  products: new Map<string, MockProduct>(),
  cartItems: new Map<string, MockCartItem>(),
  nextItemId: 1,
}));

function createProductSnapshot(productId: string) {
  return {
    id: productId,
    name: `${productId} name`,
    slug: `${productId}-slug`,
    imageUrl: "/placeholder-product.png",
    priceInPaise: 1000,
    inStock: state.products.get(productId)?.inStock ?? true,
  };
}

function createCartSnapshot(userId: string) {
  const cartId = `cart-${userId}`;
  const items = Array.from(state.cartItems.values())
    .filter((item) => item.cartId === cartId)
    .map((item) => ({
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      quantity: item.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: createProductSnapshot(item.productId),
    }));

  return {
    id: cartId,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    items,
  };
}

const prismaMock = vi.hoisted(() => ({
  cart: {
    upsert: vi.fn(async ({ where }: { where: { userId: string } }) => {
      return createCartSnapshot(where.userId);
    }),
  },
  product: {
    findMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
      return where.id.in
        .map((id) => state.products.get(id))
        .filter((product): product is MockProduct => Boolean(product))
        .map((product) => ({ id: product.id, inStock: product.inStock }));
    }),
  },
  cartItem: {
    upsert: vi.fn(
      async ({
        where,
        update,
        create,
      }: {
        where: { cartId_productId: { cartId: string; productId: string } };
        update: { quantity: number };
        create: { cartId: string; productId: string; quantity: number };
      }) => {
        const key = `${where.cartId_productId.cartId}:${where.cartId_productId.productId}`;
        const existing = state.cartItems.get(key);
        if (existing) {
          state.cartItems.set(key, { ...existing, quantity: update.quantity });
          return state.cartItems.get(key);
        }

        const next: MockCartItem = {
          id: `item-${state.nextItemId++}`,
          cartId: create.cartId,
          productId: create.productId,
          quantity: create.quantity,
        };
        state.cartItems.set(key, next);
        return next;
      },
    ),
  },
  $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => {
    return Promise.all(operations);
  }),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { mergeGuestCart } from "@/lib/cart";

function seedProducts(products: MockProduct[]) {
  for (const product of products) {
    state.products.set(product.id, product);
  }
}

function seedCartItem(input: { userId: string; productId: string; quantity: number }) {
  const cartId = `cart-${input.userId}`;
  const key = `${cartId}:${input.productId}`;
  state.cartItems.set(key, {
    id: `item-${state.nextItemId++}`,
    cartId,
    productId: input.productId,
    quantity: input.quantity,
  });
}

function expectCartQuantity(cart: Awaited<ReturnType<typeof mergeGuestCart>>["cart"], productId: string) {
  return cart.items.find((item) => item.productId === productId)?.quantity ?? 0;
}

describe("mergeGuestCart", () => {
  beforeEach(() => {
    state.products.clear();
    state.cartItems.clear();
    state.nextItemId = 1;
    prismaMock.cart.upsert.mockClear();
    prismaMock.product.findMany.mockClear();
    prismaMock.cartItem.upsert.mockClear();
    prismaMock.$transaction.mockClear();
  });

  it("returns unchanged cart and empty skipped for empty guest cart", async () => {
    seedProducts([{ id: "prod-1", inStock: true }]);
    seedCartItem({ userId: "user-1", productId: "prod-1", quantity: 2 });

    const result = await mergeGuestCart({ userId: "user-1", guestItems: [] });

    expect(result.skipped).toEqual([]);
    expect(expectCartQuantity(result.cart, "prod-1")).toBe(2);
    expect(prismaMock.cartItem.upsert).not.toHaveBeenCalled();
  });

  it("merges guest items when user cart is empty", async () => {
    seedProducts([
      { id: "prod-1", inStock: true },
      { id: "prod-2", inStock: true },
    ]);

    const result = await mergeGuestCart({
      userId: "user-1",
      guestItems: [
        { productId: "prod-1", quantity: 3 },
        { productId: "prod-2", quantity: 1 },
      ],
    });

    expect(result.skipped).toEqual([]);
    expect(expectCartQuantity(result.cart, "prod-1")).toBe(3);
    expect(expectCartQuantity(result.cart, "prod-2")).toBe(1);
  });

  it("uses max quantity when guest and user cart overlap", async () => {
    seedProducts([
      { id: "prod-1", inStock: true },
      { id: "prod-2", inStock: true },
    ]);
    seedCartItem({ userId: "user-1", productId: "prod-1", quantity: 5 });
    seedCartItem({ userId: "user-1", productId: "prod-2", quantity: 2 });

    const result = await mergeGuestCart({
      userId: "user-1",
      guestItems: [
        { productId: "prod-1", quantity: 3 },
        { productId: "prod-2", quantity: 7 },
      ],
    });

    expect(expectCartQuantity(result.cart, "prod-1")).toBe(5);
    expect(expectCartQuantity(result.cart, "prod-2")).toBe(7);
  });

  it("returns PRODUCT_NOT_FOUND for missing products and still merges valid ones", async () => {
    seedProducts([{ id: "prod-1", inStock: true }]);

    const result = await mergeGuestCart({
      userId: "user-1",
      guestItems: [
        { productId: "prod-1", quantity: 2 },
        { productId: "missing-prod", quantity: 1 },
      ],
    });

    expect(expectCartQuantity(result.cart, "prod-1")).toBe(2);
    expect(result.skipped).toEqual([{ productId: "missing-prod", reason: "PRODUCT_NOT_FOUND" }]);
  });

  it("returns OUT_OF_STOCK for unavailable products and still merges valid ones", async () => {
    seedProducts([
      { id: "prod-1", inStock: true },
      { id: "prod-2", inStock: false },
    ]);

    const result = await mergeGuestCart({
      userId: "user-1",
      guestItems: [
        { productId: "prod-1", quantity: 2 },
        { productId: "prod-2", quantity: 3 },
      ],
    });

    expect(expectCartQuantity(result.cart, "prod-1")).toBe(2);
    expect(result.skipped).toEqual([{ productId: "prod-2", reason: "OUT_OF_STOCK" }]);
  });

  it("silently ignores invalid guest input without adding skipped entries", async () => {
    seedProducts([{ id: "prod-1", inStock: true }]);

    const result = await mergeGuestCart({
      userId: "user-1",
      guestItems: [
        { productId: "prod-1", quantity: 2 },
        { productId: "", quantity: 4 },
        { productId: "prod-1", quantity: 0 },
      ],
    });

    expect(expectCartQuantity(result.cart, "prod-1")).toBe(2);
    expect(result.skipped).toEqual([]);
  });
});
