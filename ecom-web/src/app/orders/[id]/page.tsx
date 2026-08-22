"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { formatPriceCents } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    authFetch(`/api/v1/orders/${id}`).then(async (res) => {
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const body = await res.json();
        setOrder(body.order);
      }
    });
  }, [loading, user, router, authFetch, id]);

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <p className="text-foreground/60">Order not found.</p>
      </main>
    );
  }

  if (loading || !order) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <p className="text-foreground/60">Loading order...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Order {order._id}</h1>
      <p className="mt-1 text-sm capitalize text-foreground/60">Status: {order.status}</p>

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

      <div className="mt-6 rounded-lg border border-black/[.08] p-4 text-sm dark:border-white/[.145]">
        <p className="font-medium">Shipping address</p>
        <p className="mt-1 text-foreground/70">
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          <br />
          {order.shippingAddress.country}
        </p>
      </div>
    </main>
  );
}
