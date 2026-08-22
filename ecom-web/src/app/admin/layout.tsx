"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.roles.includes("admin") ?? false;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isAdmin) {
      router.push("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="text-foreground/60">Loading...</p>
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-6 py-10">
      <nav className="flex w-40 flex-shrink-0 flex-col gap-2 text-sm">
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/categories">Categories</Link>
        <Link href="/admin/orders">Orders</Link>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
