"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { formatPriceCents } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function AdminProductsPage() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    authFetch("/api/v1/products?includeInactive=true").then(async (res) => {
      if (ignore) return;
      if (!res.ok) {
        setError("Failed to load products");
        return;
      }
      const body = await res.json();
      setProducts(body.data);
    });
    return () => {
      ignore = true;
    };
  }, [authFetch]);

  async function toggleActive(product: Product) {
    setBusyId(product._id);
    setError(null);
    const res = await authFetch(`/api/v1/products/${product._id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    if (res.ok) {
      const body = await res.json();
      setProducts((prev) => prev?.map((p) => (p._id === product._id ? body.product : p)) ?? null);
    } else {
      setError("Failed to update product");
    }
    setBusyId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-foreground px-4 py-2 text-sm text-background">
          New product
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!products ? (
        <p className="mt-6 text-foreground/60">Loading...</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[.08] text-foreground/60 dark:border-white/[.145]">
              <th className="py-2">Name</th>
              <th className="py-2">Price</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-black/[.06] dark:border-white/[.1]">
                <td className="py-2">{product.name}</td>
                <td className="py-2">{formatPriceCents(product.priceCents)}</td>
                <td className="py-2">{product.stock}</td>
                <td className="py-2">{product.isActive ? "Active" : "Inactive"}</td>
                <td className="py-2 text-right">
                  <Link href={`/admin/products/${product._id}/edit`} className="mr-4 underline">
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === product._id}
                    onClick={() => toggleActive(product)}
                    className="underline disabled:opacity-50"
                  >
                    {product.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
