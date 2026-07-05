import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_CART_ITEM_QUANTITY = 99;

export type CartWithItemsAndProducts = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export class CartError extends Error {
  readonly code:
    | "PRODUCT_NOT_FOUND"
    | "PRODUCT_UNAVAILABLE"
    | "CART_ITEM_NOT_FOUND"
    | "INVALID_QUANTITY";

  constructor(code: CartError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "CartError";
  }
}

function clampQuantity(quantity: number) {
  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(0, Math.trunc(quantity)));
}

export async function getOrCreateCart(userId: string): Promise<CartWithItemsAndProducts> {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: { include: { product: true }, orderBy: { createdAt: "desc" } } },
  });
}

export async function addItemToCart(input: {
  userId: string;
  productId: string;
  quantity: number;
}): Promise<CartWithItemsAndProducts> {
  const quantity = clampQuantity(input.quantity);
  if (quantity < 1) {
    throw new CartError("INVALID_QUANTITY", "Quantity must be at least 1");
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, inStock: true },
  });
  if (!product) {
    throw new CartError("PRODUCT_NOT_FOUND", "Product not found");
  }
  if (!product.inStock) {
    throw new CartError("PRODUCT_UNAVAILABLE", "Product is currently out of stock");
  }

  const cart = await getOrCreateCart(input.userId);
  const existing = cart.items.find((item) => item.productId === input.productId);
  const nextQuantity = clampQuantity((existing?.quantity ?? 0) + quantity);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
    update: { quantity: nextQuantity },
    create: {
      cartId: cart.id,
      productId: input.productId,
      quantity: nextQuantity,
    },
  });

  return getOrCreateCart(input.userId);
}

export async function updateCartItem(input: {
  userId: string;
  itemId: string;
  quantity: number;
}): Promise<CartWithItemsAndProducts> {
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: input.itemId, cart: { userId: input.userId } },
    select: { id: true },
  });
  if (!cartItem) {
    throw new CartError("CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  const quantity = clampQuantity(input.quantity);
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: input.itemId } });
    return getOrCreateCart(input.userId);
  }

  await prisma.cartItem.update({
    where: { id: input.itemId },
    data: { quantity },
  });

  return getOrCreateCart(input.userId);
}

export async function removeCartItem(input: {
  userId: string;
  itemId: string;
}): Promise<CartWithItemsAndProducts> {
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: input.itemId, cart: { userId: input.userId } },
    select: { id: true },
  });
  if (!cartItem) {
    throw new CartError("CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  await prisma.cartItem.delete({ where: { id: input.itemId } });
  return getOrCreateCart(input.userId);
}

export async function clearCart(userId: string): Promise<void> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!cart) {
    return;
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

export async function mergeGuestCart(input: {
  userId: string;
  guestItems: Array<{ productId: string; quantity: number }>;
}): Promise<{
  cart: CartWithItemsAndProducts;
  skipped: Array<{ productId: string; reason: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK" }>;
}> {
  const cart = await getOrCreateCart(input.userId);
  const mergedGuestItems = new Map<string, number>();

  for (const item of input.guestItems) {
    const quantity = clampQuantity(item.quantity);
    if (!item.productId || quantity <= 0) {
      continue;
    }
    const current = mergedGuestItems.get(item.productId) ?? 0;
    mergedGuestItems.set(item.productId, clampQuantity(current + quantity));
  }

  if (mergedGuestItems.size === 0) {
    return { cart: await getOrCreateCart(input.userId), skipped: [] };
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: Array.from(mergedGuestItems.keys()) },
    },
    select: { id: true, inStock: true },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));
  const skipped: Array<{ productId: string; reason: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK" }> = [];

  await prisma.$transaction(
    Array.from(mergedGuestItems.entries()).flatMap(([productId, quantity]) => {
      const product = productsById.get(productId);
      if (!product) {
        skipped.push({ productId, reason: "PRODUCT_NOT_FOUND" });
        return [];
      }

      if (!product.inStock) {
        skipped.push({ productId, reason: "OUT_OF_STOCK" });
        return [];
      }

      const existingItem = cart.items.find((item) => item.productId === productId);
      const nextQuantity = clampQuantity(Math.max(existingItem?.quantity ?? 0, quantity));

      return prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        update: { quantity: nextQuantity },
        create: { cartId: cart.id, productId, quantity: nextQuantity },
      });
    }),
  );

  return { cart: await getOrCreateCart(input.userId), skipped };
}
