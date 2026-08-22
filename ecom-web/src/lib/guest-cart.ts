import type { CartItem } from "./types";

// Cart for a logged-out visitor. Lives entirely in localStorage - no backend
// call, no guest id, nothing for cart-service to know about - so it needs no
// changes to the (deliberately stateless, JWT-only) cart-service auth model.
// Mirrors auth-context.tsx's useSyncExternalStore pattern: a module-level
// cache + listener set, read through getSnapshot/getServerSnapshot so SSR
// and the first client render agree (both see "no guest cart").
const STORAGE_KEY = "ecom_guest_cart";
const EMPTY_ITEMS: CartItem[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: CartItem[] = EMPTY_ITEMS;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function subscribeGuestCart(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getGuestCartSnapshot(): CartItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = EMPTY_ITEMS;
    return cachedSnapshot;
  }
  try {
    cachedSnapshot = JSON.parse(raw) as CartItem[];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    cachedSnapshot = EMPTY_ITEMS;
  }
  return cachedSnapshot;
}

export function getGuestCartServerSnapshot(): CartItem[] {
  return EMPTY_ITEMS;
}

function writeItems(items: CartItem[]) {
  if (items.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  notifyListeners();
}

export function addGuestItem(item: CartItem) {
  const items = [...getGuestCartSnapshot()];
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
    existing.priceCents = item.priceCents; // refresh snapshot on re-add, same as cart-service
    existing.name = item.name;
  } else {
    items.push(item);
  }
  writeItems(items);
}

export function updateGuestItemQuantity(productId: string, quantity: number) {
  const items = getGuestCartSnapshot().map((item) => (item.productId === productId ? { ...item, quantity } : item));
  writeItems(items);
}

export function removeGuestItem(productId: string) {
  writeItems(getGuestCartSnapshot().filter((item) => item.productId !== productId));
}

export function clearGuestCart() {
  writeItems([]);
}

export function guestCartTotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}
