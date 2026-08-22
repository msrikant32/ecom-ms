import { API_INTERNAL_URL } from "./config";
import type { Category, Product, ProductListResponse } from "./types";

export async function getProducts(): Promise<ProductListResponse> {
  const res = await fetch(`${API_INTERNAL_URL}/api/v1/products`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }
  return res.json();
}

export async function getProduct(idOrSlug: string): Promise<Product | null> {
  const res = await fetch(`${API_INTERNAL_URL}/api/v1/products/${idOrSlug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.status}`);
  }
  const { product } = await res.json();
  return product;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_INTERNAL_URL}/api/v1/categories`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }
  const { categories } = await res.json();
  return categories;
}

export function formatPriceCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
