"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { formatPriceCents } from "@/lib/api";

export default function CartPage() {
  const { user } = useAuth();
  const { cart, updateItemQuantity, removeItem } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  async function handleUpdateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    setBusyProductId(productId);
    setError(null);
    try {
      await updateItemQuantity(productId, quantity);
    } catch {
      setError("Failed to update quantity");
    }
    setBusyProductId(null);
  }

  async function handleRemoveItem(productId: string) {
    setBusyProductId(productId);
    setError(null);
    try {
      await removeItem(productId);
    } catch {
      setError("Failed to remove item");
    }
    setBusyProductId(null);
  }

  if (!cart) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-foreground/60">Loading cart...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Your cart</h1>
      {!user && cart.items.length > 0 && (
        <p className="mt-2 text-sm text-foreground/60">
          Saved on this device. <Link href="/login?next=/checkout" className="underline">Log in</Link> to check out.
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {cart.items.length === 0 ? (
        <p className="mt-6 text-foreground/60">
          Your cart is empty. <Link href="/" className="underline">Continue shopping</Link>
        </p>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-4">
            {cart.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-sm text-foreground/60">{formatPriceCents(item.priceCents)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    disabled={busyProductId === item.productId}
                    onChange={(e) => handleUpdateQuantity(item.productId, Number(e.target.value))}
                    className="w-16 rounded-md border border-black/[.15] px-2 py-1 text-sm dark:border-white/[.2]"
                  />
                  <button
                    type="button"
                    disabled={busyProductId === item.productId}
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-sm text-red-600 underline disabled:opacity-50 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between border-t border-black/[.08] pt-4 dark:border-white/[.145]">
            <p className="text-lg font-medium">Total</p>
            <p className="text-lg font-medium">{formatPriceCents(cart.totalCents)}</p>
          </div>
          <Link
            href={user ? "/checkout" : "/login?next=/checkout"}
            className="mt-6 block w-fit rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background"
          >
            {user ? "Checkout" : "Log in to checkout"}
          </Link>
        </>
      )}
    </main>
  );
}
