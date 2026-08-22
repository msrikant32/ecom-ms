"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getProduct } from "@/lib/api";
import ProductForm, { type ProductFormValues } from "@/components/admin/ProductForm";
import type { Product } from "@/lib/types";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;
    getProduct(id).then((p) => {
      if (ignore) return;
      if (!p) {
        setNotFound(true);
        return;
      }
      setProduct(p);
    });
    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleUpdate(values: ProductFormValues) {
    const res = await authFetch(`/api/v1/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message ?? "Failed to update product");
    }
    router.push("/admin/products");
  }

  if (notFound) return <p className="text-foreground/60">Product not found.</p>;
  if (!product) return <p className="text-foreground/60">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <div className="mt-6">
        <ProductForm initial={product} onSubmit={handleUpdate} submitLabel="Save changes" />
      </div>
    </div>
  );
}
