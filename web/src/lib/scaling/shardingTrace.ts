import { naiveShard } from "./hash";

export const SHARD_COUNT = 4;

export interface ShardWrite {
  id: number;
  key: string;
  isHotKey: boolean;
  shardIndex: number;
}

export interface ShardingStep {
  narration: string;
  writesSoFar: ShardWrite[];
  shardLoads: number[]; // length SHARD_COUNT, cumulative write count per shard
}

const NORMAL_KEYS = Array.from({ length: 16 }, (_, i) => `cust_${String(i + 1).padStart(3, "0")}`);
const SALT_SUFFIXES = ["a", "b", "c", "d", "e", "f", "g", "h"];

/** Interleaves 16 normal keys with 8 hot-key writes (every 3rd write), so load climbs visibly over time rather than arriving all at once. */
function buildWriteOrder(hotKeyFor: (occurrence: number) => string): { key: string; isHotKey: boolean }[] {
  const order: { key: string; isHotKey: boolean }[] = [];
  let normalIndex = 0;
  let hotOccurrence = 0;
  while (normalIndex < NORMAL_KEYS.length) {
    order.push({ key: NORMAL_KEYS[normalIndex++], isHotKey: false });
    if (normalIndex < NORMAL_KEYS.length) order.push({ key: NORMAL_KEYS[normalIndex++], isHotKey: false });
    if (hotOccurrence < 8) {
      order.push({ key: hotKeyFor(hotOccurrence), isHotKey: true });
      hotOccurrence += 1;
    }
  }
  return order;
}

function buildSteps(order: { key: string; isHotKey: boolean }[], narrationFor: (w: ShardWrite, loads: number[]) => string): ShardingStep[] {
  const steps: ShardingStep[] = [];
  const writes: ShardWrite[] = [];
  const loads = Array(SHARD_COUNT).fill(0) as number[];
  let nextId = 1;

  for (const { key, isHotKey } of order) {
    const shardIndex = naiveShard(key, SHARD_COUNT);
    loads[shardIndex] += 1;
    const write: ShardWrite = { id: nextId++, key, isHotKey, shardIndex };
    writes.push(write);
    steps.push({
      narration: narrationFor(write, loads),
      writesSoFar: [...writes],
      shardLoads: [...loads],
    });
  }
  return steps;
}

/** Same unsalted hot key every time — naturally collides on one shard by construction of the hash function being deterministic. */
export const naiveShardingSteps: ShardingStep[] = buildSteps(
  buildWriteOrder(() => "cust_VIP"),
  (w, loads) =>
    w.isHotKey
      ? `Write to hot key "cust_VIP" — always the same string, always shard ${w.shardIndex} (now ${loads[w.shardIndex]} writes there).`
      : `Write to "${w.key}" → shard ${w.shardIndex}.`
);

/** Each hot-key write carries a distinct salt suffix before hashing, spreading it across shards. */
export const saltedShardingSteps: ShardingStep[] = buildSteps(
  buildWriteOrder((occurrence) => `cust_VIP#${SALT_SUFFIXES[occurrence]}`),
  (w, loads) =>
    w.isHotKey
      ? `Salted write "${w.key}" → shard ${w.shardIndex} (now ${loads[w.shardIndex]} writes there) — a different salt, a different shard.`
      : `Write to "${w.key}" → shard ${w.shardIndex}.`
);
