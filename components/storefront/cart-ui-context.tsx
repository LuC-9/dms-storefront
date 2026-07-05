"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CartUIContextValue = {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setIsOpen: (open: boolean) => void;
};

const CartUIContext = createContext<CartUIContextValue | null>(null);

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<CartUIContextValue>(
    () => ({
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      setIsOpen,
    }),
    [isOpen],
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}

export function useCartUI() {
  const context = useContext(CartUIContext);
  if (!context) {
    throw new Error("useCartUI must be used within <CartUIProvider />");
  }
  return context;
}
