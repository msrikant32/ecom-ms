"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { formatPriceCents } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pending", "paid", "failed", "cancelled", "shipped", "delivered"];

export default function AdminOrdersPage() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const query = statusFilter ? `?status=${statusFilter}` : "";
    authFetch(`/api/v1/orders/admin${query}`).then(async (res) => {
      if (ignore) return;
      if (!res.ok) {
        setError("Failed to load orders");
        return;
      }
      const body = await res.json();
      setOrders(body.data);
    });
    return () => {
      ignore = true;
    };
  }, [authFetch, statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
          className="rounded-md border border-black/[.15] px-3 py-2 text-sm dark:border-white/[.2]"
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!orders ? (
        <p className="mt-6 text-foreground/60">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-foreground/60">No orders match this filter.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order._id}>
              <Link
                href={`/admin/orders/${order._id}`}
                className="flex items-center justify-between rounded-lg border border-black/[.08] p-4 text-sm dark:border-white/[.145]"
              >
                <div>
                  <p className="font-medium">{order._id}</p>
                  <p className="text-foreground/60">{order.userId}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPriceCents(order.totalCents)}</p>
                  <p className="capitalize text-foreground/60">{order.status}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
