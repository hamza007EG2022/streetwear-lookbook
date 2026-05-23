"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  addresses: { id: string; label: string; address: string; governorate: string; isDefault: boolean }[];
  wishlist: string[];
  loyaltyPoints: number;
  createdAt: number;
}

interface CustomerAuthContextType {
  customer: CustomerData | null;
  loading: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<string | null>;
  register: (name: string, phone: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  refresh: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/customer-me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = useCallback(async (identifier: string, password: string, remember?: boolean): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/customer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, remember }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Login failed";
      setCustomer(data.customer);
      return null;
    } catch {
      return "Network error";
    }
  }, []);

  const register = useCallback(async (name: string, phone: string, email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Registration failed";
      setCustomer(data.customer);
      return null;
    } catch {
      return "Network error";
    }
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/customer-login", { method: "DELETE", credentials: "include" }).catch(() => {});
    setCustomer(null);
  }, []);

  const refresh = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!customer) return;
    try {
      const res = await fetch("/api/customer/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer((prev) => prev ? { ...prev, wishlist: data.wishlist } : prev);
      }
    } catch {}
  }, [customer]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!customer) return;
    try {
      const res = await fetch("/api/customer/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer((prev) => prev ? { ...prev, wishlist: data.wishlist } : prev);
      }
    } catch {}
  }, [customer]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return customer?.wishlist?.includes(productId) || false;
  }, [customer]);

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, login, register, logout, refresh, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
