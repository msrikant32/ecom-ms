"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { getCategories } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/lib/auth-context";
import type { Category, Product } from "@/lib/types";

export interface ProductFormValues {
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  category: string;
  images: string[];
}

export default function ProductForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Product;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? (initial.priceCents / 100).toString() : "");
  const [stock, setStock] = useState(initial ? initial.stock.toString() : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.images?.[0] ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    getCategories().then((cats) => {
      if (!ignore) setCategories(cats);
    });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await authFetch("/api/v1/uploads", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to upload image");
      }
      const body = await res.json();
      setImageUrl(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name,
        description,
        priceCents: Math.round(Number(price) * 100),
        stock: Number(stock),
        category,
        images: imageUrl ? [imageUrl] : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Price (USD)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Stock
          <input
            required
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Category
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
        >
          <option value="" disabled>
            {categories ? "Select a category" : "Loading categories..."}
          </option>
          {categories?.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>
      {uploading && <p className="text-xs text-foreground/50">Uploading...</p>}
      {imageUrl && (
        <div className="relative h-32 w-32 overflow-hidden rounded-md bg-black/[.04] dark:bg-white/[.06]">
          <Image src={`${API_BASE_URL}${imageUrl}`} alt="Product preview" fill className="object-cover" />
        </div>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="mt-2 w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
