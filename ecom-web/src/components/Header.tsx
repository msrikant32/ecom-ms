"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          Ecom
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/">Shop</Link>
          <Link href="/cart">
            Cart{itemCount > 0 && <span className="ml-1 text-foreground/60">({itemCount})</span>}
          </Link>
          {!loading && user && (
            <>
              <Link href="/orders">Orders</Link>
              {user.roles.includes("admin") && <Link href="/admin/products">Admin</Link>}
              <span className="text-foreground/60">{user.email}</span>
              <button type="button" onClick={() => logout()} className="cursor-pointer">
                Log out
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
