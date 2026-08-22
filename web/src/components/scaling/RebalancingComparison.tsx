import { computeRebalancingComparison } from "@/lib/scaling/rebalancingComparison";

export function RebalancingComparison() {
  const { totalKeys, naiveMoved, consistentMoved } = computeRebalancingComparison();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Adding a 5th shard to 4 — how many of {totalKeys} keys have to move?
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Computed for real from the same hash function as the animation above, run twice — once
          at shard count 4, once at 5 — for the same {totalKeys} sample keys, for each scheme.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
            <span>Naive hash % shard count</span>
            <span className="font-mono">
              {naiveMoved} / {totalKeys} moved
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${(naiveMoved / totalKeys) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
            <span>Consistent hashing (20 virtual nodes/shard)</span>
            <span className="font-mono">
              {consistentMoved} / {totalKeys} moved
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${(consistentMoved / totalKeys) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Naive re-hashing reassigns almost every key when the shard count changes — nearly the
        entire dataset has to move, even though only one shard was added. Consistent hashing only
        reassigns the slice of the ring the new shard actually claims.
      </p>
    </div>
  );
}
