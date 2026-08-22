"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { formatPriceCents } from "@/lib/api";
import type { Order } from "@/lib/types";

const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "text-yellow-600 dark:text-yellow-400",
  paid: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
  cancelled: "text-red-600 dark:text-red-400",
  shipped: "text-blue-600 dark:text-blue-400",
  delivered: "text-green-600 dark:text-green-400",
};

export default function OrdersPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    authFetch("/api/v1/orders").then(async (res) => {
      if (res.ok) {
        const body = await res.json();
        setOrders(body.data);
      }
    });
  }, [loading, user, router, authFetch]);

  if (loading || !orders) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-foreground/60">Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Your orders</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-foreground/60">
          No orders yet. <Link href="/" className="underline">Start shopping</Link>
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order._id}>
              <Link
                href={`/orders/${order._id}`}
                className="flex items-center justify-between rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <div>
                  <p className="text-sm font-medium">Order {order._id}</p>
                  <p className="text-sm text-foreground/60">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatPriceCents(order.totalCents)}</p>
                  <p className={`text-xs capitalize ${STATUS_STYLES[order.status]}`}>{order.status}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
