"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import {
  addGuestItem,
  clearGuestCart,
  getGuestCartServerSnapshot,
  getGuestCartSnapshot,
  guestCartTotalCents,
  removeGuestItem,
  subscribeGuestCart,
  updateGuestItemQuantity,
} from "./guest-cart";
import type { Cart, CartItem } from "./types";

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  isGuest: boolean;
  setCart: (cart: Cart | null) => void;
  refreshCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  updateItemQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function guestCart(items: CartItem[]): Cart {
  return { _id: "guest", userId: "guest", items, totalCents: guestCartTotalCents(items) };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, authFetch } = useAuth();
  const [rawCart, setRawCart] = useState<Cart | null>(null);
  const guestItems = useSyncExternalStore(subscribeGuestCart, getGuestCartSnapshot, getGuestCartServerSnapshot);

  // Load the server cart whenever a user becomes present. No setState call in
  // the "no user" branch - see the derived `cart` below instead of clearing
  // state imperatively from the effect body.
  useEffect(() => {
    if (!user) return;
    let ignore = false;
    authFetch("/api/v1/cart").then(async (res) => {
      if (ignore || !res.ok) return;
      const body = await res.json();
      setRawCart(body.cart);
    });
    return () => {
      ignore = true;
    };
  }, [user, authFetch]);

  // On the transition from logged-out to logged-in, fold whatever the guest
  // accumulated into the now-available server cart, then drop the local
  // copy - cart-service's own addItem already merges quantities/re-validates
  // stock, so this just replays the same POST the guest's clicks would have
  // made had they been authenticated at the time.
  const wasLoggedIn = useRef(false);
  useEffect(() => {
    if (!user || wasLoggedIn.current) {
      wasLoggedIn.current = Boolean(user);
      return;
    }
    wasLoggedIn.current = true;
    const itemsToMerge = getGuestCartSnapshot();
    if (itemsToMerge.length === 0) return;
    // Clear before the async loop, not after - React StrictMode's dev-only
    // double-invoke runs this effect body twice back-to-back with no await
    // in between, so clearing late would let both invocations read the same
    // still-present items and double-post every quantity.
    clearGuestCart();
    (async () => {
      for (const item of itemsToMerge) {
        await authFetch("/api/v1/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
        }).catch(() => {});
      }
      const res = await authFetch("/api/v1/cart");
      if (res.ok) {
        const body = await res.json();
        setRawCart(body.cart);
      }
    })();
  }, [user, authFetch]);

  // Derived, not stored - guarantees a logged-out consumer never sees a
  // previous user's cart, without needing an effect to reset it.
  const cart = user ? rawCart : guestCart(guestItems);

  // Exposed for flows that mutate the cart server-side without getting the
  // updated cart back in their own response (e.g. checkout, which returns
  // an order, not a cart).
  const refreshCart = useCallback(async () => {
    if (!user) return;
    const res = await authFetch("/api/v1/cart");
    if (res.ok) {
      const body = await res.json();
      setRawCart(body.cart);
    }
  }, [user, authFetch]);

  const addItem = useCallback(
    async (item: CartItem) => {
      if (!user) {
        addGuestItem(item);
        return;
      }
      const res = await authFetch("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
      });
      if (res.ok) {
        const body = await res.json();
        setRawCart(body.cart);
      } else {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to add to cart");
      }
    },
    [user, authFetch]
  );

  const updateItemQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!user) {
        updateGuestItemQuantity(productId, quantity);
        return;
      }
      const res = await authFetch(`/api/v1/cart/items/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const body = await res.json();
        setRawCart(body.cart);
      } else {
        throw new Error("Failed to update quantity");
      }
    },
    [user, authFetch]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (!user) {
        removeGuestItem(productId);
        return;
      }
      const res = await authFetch(`/api/v1/cart/items/${productId}`, { method: "DELETE" });
      if (res.ok) {
        const body = await res.json();
        setRawCart(body.cart);
      } else {
        throw new Error("Failed to remove item");
      }
    },
    [user, authFetch]
  );

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{ cart, itemCount, isGuest: !user, setCart: setRawCart, refreshCart, addItem, updateItemQuantity, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
