import { naiveShard, buildConsistentHashRing, consistentShard } from "./hash";

const SAMPLE_KEYS = Array.from({ length: 24 }, (_, i) => `cust_${String(i + 1).padStart(3, "0")}`);

export interface RebalancingComparison {
  totalKeys: number;
  naiveMoved: number;
  consistentMoved: number;
}

/** Computed for real from the same hash functions the sharding animation uses — not a claimed/fabricated ratio. */
export function computeRebalancingComparison(): RebalancingComparison {
  const naiveBefore = SAMPLE_KEYS.map((k) => naiveShard(k, 4));
  const naiveAfter = SAMPLE_KEYS.map((k) => naiveShard(k, 5));
  const naiveMoved = naiveBefore.filter((shard, i) => shard !== naiveAfter[i]).length;

  const ring4 = buildConsistentHashRing(4);
  const ring5 = buildConsistentHashRing(5);
  const consistentBefore = SAMPLE_KEYS.map((k) => consistentShard(k, ring4));
  const consistentAfter = SAMPLE_KEYS.map((k) => consistentShard(k, ring5));
  const consistentMoved = consistentBefore.filter((shard, i) => shard !== consistentAfter[i]).length;

  return { totalKeys: SAMPLE_KEYS.length, naiveMoved, consistentMoved };
}
