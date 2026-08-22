"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import type { Address, Order } from "@/lib/types";

const emptyAddress: Address = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" };

export default function CheckoutPage() {
  const { user, loading, authFetch } = useAuth();
  const { refreshCart } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declinedOrder, setDeclinedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/checkout");
  }, [loading, user, router]);

  function updateField<K extends keyof Address>(key: K, value: Address[K]) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setDeclinedOrder(null);
    try {
      const res = await authFetch("/api/v1/orders", {
        method: "POST",
        body: JSON.stringify({ shippingAddress: address }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Checkout failed");
      }
      const order: Order = body.order;
      if (order.status === "paid") {
        // order-service already cleared the cart server-side on payment
        // success - resync the shared cart state so the header badge and
        // /cart reflect it immediately, not just after the next fetch.
        await refreshCart();
        router.push(`/orders/${order._id}`);
      } else {
        // Payment declined - order-service leaves the cart untouched so the
        // user can fix payment details and try again without re-adding items.
        setDeclinedOrder(order);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      {declinedOrder && (
        <div className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950">
          <p className="font-medium text-red-700 dark:text-red-400">Payment declined</p>
          <p className="mt-1 text-red-600 dark:text-red-400">
            Your cart is still intact - please try again.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Address line 1
          <input
            required
            value={address.line1}
            onChange={(e) => updateField("line1", e.target.value)}
            className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Address line 2 (optional)
          <input
            value={address.line2}
            onChange={(e) => updateField("line2", e.target.value)}
            className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            City
            <input
              required
              value={address.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            State
            <input
              required
              value={address.state}
              onChange={(e) => updateField("state", e.target.value)}
              className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Postal code
            <input
              required
              value={address.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
              className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Country
            <input
              required
              value={address.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {submitting ? "Placing order..." : "Place order"}
        </button>
      </form>
    </main>
  );
}
