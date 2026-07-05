"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/toast";

const GUEST_CART_KEY = "dms.cart";

type CartProductInput = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  priceInPaise: number;
  inStock?: boolean;
};

type GuestCartItem = {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  imageUrl: string;
  priceInPaise: number;
  inStock?: boolean;
};

type CartItemIdentifier = {
  id?: string;
  productId: string;
};

type CartItem = CartItemIdentifier & {
  quantity: number;
  name: string;
  slug: string;
  imageUrl: string;
  priceInPaise: number;
  inStock?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  subtotalInPaise: number;
  itemCount: number;
  isLoading: boolean;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (product: CartProductInput, quantity?: number) => Promise<void>;
  updateItem: (target: CartItemIdentifier, quantity: number) => Promise<void>;
  removeItem: (target: CartItemIdentifier) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(quantity: number) {
  return Math.max(1, Math.min(99, Math.floor(quantity)));
}

function readGuestCartItems(): GuestCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(GUEST_CART_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as { items?: GuestCartItem[] };
    if (!Array.isArray(parsed.items)) {
      return [];
    }
    return parsed.items
      .filter((item) => item?.productId && item?.name && item?.slug)
      .map((item) => ({
        productId: item.productId,
        quantity: clampQuantity(item.quantity),
        name: item.name,
        slug: item.slug,
        imageUrl: item.imageUrl || "/placeholder-product.png",
        priceInPaise: Number.isFinite(item.priceInPaise) ? item.priceInPaise : 0,
        inStock: item.inStock,
      }));
  } catch {
    return [];
  }
}

function writeGuestCartItems(items: GuestCartItem[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify({ items }));
}

function normalizeGuestItems(items: GuestCartItem[]): CartItem[] {
  return items.map((item) => ({
    productId: item.productId,
    quantity: clampQuantity(item.quantity),
    name: item.name,
    slug: item.slug,
    imageUrl: item.imageUrl || "/placeholder-product.png",
    priceInPaise: Number.isFinite(item.priceInPaise) ? item.priceInPaise : 0,
    inStock: item.inStock,
  }));
}

type CartApiResponse = {
  id: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: {
      name: string;
      slug: string;
      imageUrl: string;
      priceInPaise: number;
      inStock: boolean;
    };
  }>;
  subtotalInPaise: number;
};

type MergeCartResponse = {
  cart: CartApiResponse;
  skipped: Array<{ productId: string; reason: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK" }>;
};

async function fetchServerCart(): Promise<CartApiResponse> {
  const response = await fetch("/api/cart", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch cart");
  }
  return response.json();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isCustomer = status === "authenticated" && session?.user?.userType === "customer";
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const mergedForUserRef = useRef<string | null>(null);
  const mergeInFlightForUserRef = useRef<string | null>(null);
  const hasSyncedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (status === "loading") {
      return;
    }

    if (isCustomer) {
      const payload = await fetchServerCart();
      setItems(
        payload.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: clampQuantity(item.quantity),
          name: item.product.name,
          slug: item.product.slug,
          imageUrl: item.product.imageUrl,
          priceInPaise: item.product.priceInPaise,
          inStock: item.product.inStock,
        })),
      );
      return;
    }

    setItems(normalizeGuestItems(readGuestCartItems()));
  }, [isCustomer, status]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    const sync = async () => {
      setIsLoading(true);

      try {
        if (isCustomer && session?.user?.id) {
          const userId = session.user.id;
          const guestItems = readGuestCartItems();

          if (
            guestItems.length > 0 &&
            mergedForUserRef.current !== userId &&
            mergeInFlightForUserRef.current !== userId
          ) {
            mergeInFlightForUserRef.current = userId;
            const mergeResponse = await fetch("/api/cart/merge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: guestItems.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                })),
              }),
            });

            if (!mergeResponse.ok) {
              throw new Error("Failed to merge guest cart");
            }

            const payload = (await mergeResponse.json()) as MergeCartResponse;
            if (Array.isArray(payload.skipped) && payload.skipped.length > 0) {
              const outOfStockCount = payload.skipped.filter(
                (item) => item.reason === "OUT_OF_STOCK",
              ).length;
              const missingCount = payload.skipped.length - outOfStockCount;
              const messageParts: string[] = [];
              if (outOfStockCount > 0) {
                messageParts.push(
                  `${outOfStockCount} item${outOfStockCount === 1 ? "" : "s"} out of stock`,
                );
              }
              if (missingCount > 0) {
                messageParts.push(
                  `${missingCount} item${missingCount === 1 ? "" : "s"} unavailable`,
                );
              }
              toast({
                title: "Some guest cart items were skipped",
                description: messageParts.join(", "),
              });
            }

            mergedForUserRef.current = userId;
            window.localStorage.removeItem(GUEST_CART_KEY);
            mergeInFlightForUserRef.current = null;
          }

          await refresh();
        } else {
          await refresh();
          mergedForUserRef.current = null;
          mergeInFlightForUserRef.current = null;
        }
        hasSyncedRef.current = true;
      } catch {
        if (!hasSyncedRef.current) {
          setItems([]);
        }
        mergeInFlightForUserRef.current = null;
      } finally {
        setIsLoading(false);
      }
    };

    void sync();
  }, [isCustomer, refresh, session?.user?.id, status]);

  const addItem = useCallback(
    async (product: CartProductInput, quantity = 1) => {
      const safeQuantity = clampQuantity(quantity);

      if (isCustomer) {
        await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: safeQuantity }),
        });
        await refresh();
      } else {
        const existing = readGuestCartItems();
        const next = [...existing];
        const index = next.findIndex((item) => item.productId === product.id);
        if (index >= 0) {
          next[index] = {
            ...next[index],
            quantity: clampQuantity(next[index].quantity + safeQuantity),
            name: product.name,
            slug: product.slug,
            imageUrl: product.imageUrl,
            priceInPaise: product.priceInPaise,
            inStock: product.inStock,
          };
        } else {
          next.push({
            productId: product.id,
            quantity: safeQuantity,
            name: product.name,
            slug: product.slug,
            imageUrl: product.imageUrl,
            priceInPaise: product.priceInPaise,
            inStock: product.inStock,
          });
        }
        writeGuestCartItems(next);
        setItems(normalizeGuestItems(next));
      }
    },
    [isCustomer, refresh],
  );

  const updateItem = useCallback(
    async (target: CartItemIdentifier, quantity: number) => {
      const safeQuantity = clampQuantity(quantity);

      if (isCustomer) {
        const targetId =
          target.id ??
          items.find((item) => item.productId === target.productId)?.id;
        if (!targetId) {
          return;
        }
        await fetch(`/api/cart/items/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: safeQuantity }),
        });
        await refresh();
      } else {
        const existing = readGuestCartItems();
        const next = existing.map((item) =>
          item.productId === target.productId
            ? {
                ...item,
                quantity: safeQuantity,
              }
            : item,
        );
        writeGuestCartItems(next);
        setItems(normalizeGuestItems(next));
      }
    },
    [isCustomer, items, refresh],
  );

  const removeItem = useCallback(
    async (target: CartItemIdentifier) => {
      if (isCustomer) {
        const targetId =
          target.id ??
          items.find((item) => item.productId === target.productId)?.id;
        if (!targetId) {
          return;
        }
        await fetch(`/api/cart/items/${targetId}`, { method: "DELETE" });
        await refresh();
      } else {
        const existing = readGuestCartItems();
        const next = existing.filter((item) => item.productId !== target.productId);
        writeGuestCartItems(next);
        setItems(normalizeGuestItems(next));
      }
    },
    [isCustomer, items, refresh],
  );

  const clear = useCallback(async () => {
    if (isCustomer) {
      await Promise.all(
        items
          .filter((item) => Boolean(item.id))
          .map((item) => fetch(`/api/cart/items/${item.id}`, { method: "DELETE" })),
      );
      await refresh();
    } else {
      window.localStorage.removeItem(GUEST_CART_KEY);
      setItems([]);
    }
  }, [isCustomer, items, refresh]);

  const subtotalInPaise = useMemo(
    () =>
      items.reduce((sum, item) => {
        return sum + item.quantity * item.priceInPaise;
      }, 0),
    [items],
  );
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      subtotalInPaise,
      itemCount,
      isLoading,
      isOpen,
      openDrawer: () => setIsOpen(true),
      closeDrawer: () => setIsOpen(false),
      toggleDrawer: () => setIsOpen((prev) => !prev),
      addItem,
      updateItem,
      removeItem,
      clear,
      refresh,
    }),
    [
      addItem,
      clear,
      isLoading,
      isOpen,
      itemCount,
      items,
      refresh,
      removeItem,
      subtotalInPaise,
      updateItem,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within <CartProvider />");
  }
  return context;
}
