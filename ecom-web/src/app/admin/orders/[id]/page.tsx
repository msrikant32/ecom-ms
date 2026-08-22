"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { formatPriceCents } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pending", "paid", "failed", "cancelled", "shipped", "delivered"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    authFetch(`/api/v1/orders/${id}`).then(async (res) => {
      if (ignore) return;
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const body = await res.json();
        setOrder(body.order);
      }
    });
    return () => {
      ignore = true;
    };
  }, [authFetch, id]);

  async function updateStatus(status: OrderStatus) {
    setUpdating(true);
    setError(null);
    const res = await authFetch(`/api/v1/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const body = await res.json();
      setOrder(body.order);
    } else {
      setError("Failed to update status");
    }
    setUpdating(false);
  }

  if (notFound) return <p className="text-foreground/60">Order not found.</p>;
  if (!order) return <p className="text-foreground/60">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Order {order._id}</h1>
      <p className="mt-1 text-sm text-foreground/60">Customer: {order.userId}</p>

      <ul className="mt-6 flex flex-col gap-3">
        {order.items.map((item) => (
          <li key={item.productId} className="flex items-center justify-between text-sm">
            <span>
              {item.name} &times; {item.quantity}
            </span>
            <span>{formatPriceCents(item.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-black/[.08] pt-4 text-lg font-medium dark:border-white/[.145]">
        <p>Total</p>
        <p>{formatPriceCents(order.totalCents)}</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <label className="text-sm">Status</label>
        <select
          value={order.status}
          disabled={updating}
          onChange={(e) => updateStatus(e.target.value as OrderStatus)}
          className="rounded-md border border-black/[.15] px-3 py-2 text-sm capitalize dark:border-white/[.2]"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
