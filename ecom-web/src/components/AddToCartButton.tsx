"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  priceCents: number;
  stock: number;
}

export default function AddToCartButton({ productId, name, priceCents, stock }: AddToCartButtonProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleAddToCart() {
    setStatus("adding");
    setError(null);
    try {
      await addItem({ productId, name, priceCents, quantity });
      setStatus("added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart");
      setStatus("error");
    }
  }

  if (stock <= 0) {
    return <p className="text-sm text-red-600 dark:text-red-400">Out of stock</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        Quantity
        <input
          type="number"
          min={1}
          max={stock}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(stock, Number(e.target.value))))}
          className="w-16 rounded-md border border-black/[.15] px-2 py-1 dark:border-white/[.2]"
        />
      </label>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={status === "adding"}
        className="w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {status === "adding" ? "Adding..." : status === "added" ? "Added to cart" : "Add to cart"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!user && <p className="text-xs text-foreground/50">Saved to your cart. Log in when you&apos;re ready to check out.</p>}
    </div>
  );
}
