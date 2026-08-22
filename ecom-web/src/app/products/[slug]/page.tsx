import { notFound } from "next/navigation";
import Image from "next/image";
import { getProduct, formatPriceCents } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const image = product.images[0];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black/[.04] dark:bg-white/[.06]">
          {image && (
            <Image
              src={`${API_BASE_URL}${image}`}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="mt-2 text-xl text-foreground/80">{formatPriceCents(product.priceCents)}</p>
          {product.description && <p className="mt-4 text-sm text-foreground/70">{product.description}</p>}
          <p className="mt-2 text-xs text-foreground/50">{product.stock} in stock</p>
          <div className="mt-6">
            <AddToCartButton
              productId={product._id}
              name={product.name}
              priceCents={product.priceCents}
              stock={product.stock}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
