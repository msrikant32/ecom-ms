import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ShardingAnimation } from "@/components/scaling/ShardingAnimation";
import { RebalancingComparison } from "@/components/scaling/RebalancingComparison";

export const metadata: Metadata = {
  title: "Sharding & Hotspots — Databases",
};

export default function DatabaseScalingPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Databases", href: "/databases" }, { label: "Sharding & Hotspots" }]}
      />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-lime-600 dark:text-lime-400">
          Animated
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sharding, hotspots, and rebalancing — watch it happen
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Every number below is computed live from a real hash function, not staged — the same
          write stream (16 normal keys + one hot key, interleaved) run through naive hashing vs a
          salted key, and a real before/after comparison of how many keys move when a shard is
          added.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            One hot key, four shards
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <code className="font-mono">cust_VIP</code> writes far more often than any other
            customer. Naive hashing sends every one of its writes to the exact same shard, every
            time — watch that shard&apos;s bar pull ahead. Switch to the salted tab to see the fix:
            the same writes, each with a different salt suffix, land on different shards instead.
          </p>
        </div>
        <ShardingAnimation />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Growing the cluster — naive rehash vs. consistent hashing
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Salting fixes one hot key. This is the other half of the rebalancing problem: when the
            cluster itself grows, how much data has to physically move?
          </p>
        </div>
        <RebalancingComparison />
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        This is the animated version of the scaling methodology&apos;s hotspot and rebalancing
        steps:{" "}
        <Link
          href="/interview/distributed-database-scaling-methodology"
          className="text-lime-600 hover:underline dark:text-lime-400"
        >
          the full step-by-step framework →
        </Link>
      </p>
    </div>
  );
}
