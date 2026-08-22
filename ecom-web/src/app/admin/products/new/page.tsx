"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProductForm, { type ProductFormValues } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  const { authFetch } = useAuth();
  const router = useRouter();

  async function handleCreate(values: ProductFormValues) {
    const res = await authFetch("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message ?? "Failed to create product");
    }
    router.push("/admin/products");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">New product</h1>
      <div className="mt-6">
        <ProductForm onSubmit={handleCreate} submitLabel="Create product" />
      </div>
    </div>
  );
}
