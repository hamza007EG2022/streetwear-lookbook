"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: string;
  discountPrice?: string;
  photo: string;
  color?: string;
  colorLabel?: string;
  size: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, size: string, color?: string) => void;
  updateQuantity: (productId: string, size: string, color: string | undefined, delta: number) => void;
  setQuantity: (productId: string, size: string, color: string | undefined, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: string;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "trio_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
    }
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const qty = item.quantity || 1;
      const key = `${item.productId}_${item.size}_${item.color || ""}`;
      const existingIdx = prev.findIndex(
        (i) => `${i.productId}_${i.size}_${i.color || ""}` === key
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + qty };
        return updated;
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size: string, color?: string) => {
    const key = `${productId}_${size}_${color || ""}`;
    setItems((prev) => prev.filter((i) => `${i.productId}_${i.size}_${i.color || ""}` !== key));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, color: string | undefined, delta: number) => {
    const key = `${productId}_${size}_${color || ""}`;
    setItems((prev) => {
      const idx = prev.findIndex((i) => `${i.productId}_${i.size}_${i.color || ""}` === key);
      if (idx < 0) return prev;
      const updated = [...prev];
      const newQty = Math.max(0, updated[idx].quantity + delta);
      if (newQty === 0) return updated.filter((_, i) => i !== idx);
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  }, []);

  const setQuantity = useCallback((productId: string, size: string, color: string | undefined, qty: number) => {
    const key = `${productId}_${size}_${color || ""}`;
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => `${i.productId}_${i.size}_${i.color || ""}` !== key);
      const idx = prev.findIndex((i) => `${i.productId}_${i.size}_${i.color || ""}` === key);
      if (idx < 0) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: qty };
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const totalPrice = (() => {
    const total = items.reduce((sum, i) => {
      const priceStr = i.discountPrice || i.price;
      const num = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
      return sum + num * i.quantity;
    }, 0);
    const firstItem = items[0];
    const prefix = firstItem ? (firstItem.discountPrice || firstItem.price).replace(/[\d.,]+/, "").replace(/[\d.]+$/, "").trim() : "";
    return prefix ? prefix + " " + total.toFixed(2) : total.toFixed(2);
  })();

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, setQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
