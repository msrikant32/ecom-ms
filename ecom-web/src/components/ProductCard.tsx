import Link from "next/link";
import Image from "next/image";
import { formatPriceCents } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-lg border border-black/[.08] p-4 transition hover:shadow-md dark:border-white/[.145]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-black/[.04] dark:bg-white/[.06]">
        {image && (
          <Image
            src={`${API_BASE_URL}${image}`}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      <h2 className="mt-3 text-sm font-medium">{product.name}</h2>
      <p className="mt-1 text-sm text-foreground/70">{formatPriceCents(product.priceCents)}</p>
      {outOfStock && <p className="mt-1 text-xs text-red-600 dark:text-red-400">Out of stock</p>}
    </Link>
  );
}
