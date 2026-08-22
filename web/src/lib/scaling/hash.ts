// A small, fast, deterministic string hash (DJB2-family accumulation) — not
// cryptographic, not meant to be; just needs to be stable across runs so
// the animation's outcome is reproducible and independently verifiable.
export function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) | 0;
  }
  // Finalizing avalanche mix (Murmur3's fmix32) — without this, two inputs
  // that share every character except the last one produce hashes that
  // differ by only the tiny gap between those two character codes (an
  // inherent property of left-to-right accumulation with no final mixing
  // step), which clustered every shard's vnodes into a near-zero slice of
  // the ring and silently broke the consistent-hashing comparison below.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

export function naiveShard(key: string, shardCount: number): number {
  return simpleHash(key) % shardCount;
}

interface RingEntry {
  hash: number;
  shard: number;
}

/** A consistent-hashing ring with virtual nodes per shard, for smoother distribution. */
export function buildConsistentHashRing(shardCount: number, vnodesPerShard = 20): RingEntry[] {
  const ring: RingEntry[] = [];
  for (let shard = 0; shard < shardCount; shard++) {
    for (let vnode = 0; vnode < vnodesPerShard; vnode++) {
      ring.push({ hash: simpleHash(`shard-${shard}-vnode-${vnode}`), shard });
    }
  }
  return ring.sort((a, b) => a.hash - b.hash);
}

export function consistentShard(key: string, ring: RingEntry[]): number {
  const h = simpleHash(key);
  const owner = ring.find((entry) => entry.hash >= h);
  return (owner ?? ring[0]).shard;
}
