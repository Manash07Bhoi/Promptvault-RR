/**
 * In-memory cache-aside service with TTL support.
 * Drop-in replacement for Redis when not available.
 * Keys are evicted after TTL expires (lazy eviction on get + periodic sweep).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private sweepIntervalMs: number;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(sweepIntervalMs = 60_000) {
    this.sweepIntervalMs = sweepIntervalMs;
    this.startSweep();
  }

  private startSweep() {
    this.sweepTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.expiresAt < now) this.store.delete(key);
      }
    }, this.sweepIntervalMs);
    this.sweepTimer.unref?.();
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  /** Delete all keys matching a prefix pattern */
  invalidate(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  flush(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  stats() {
    const now = Date.now();
    let expired = 0;
    let alive = 0;
    for (const entry of this.store.values()) {
      if (entry.expiresAt < now) expired++;
      else alive++;
    }
    return { total: this.store.size, alive, expired };
  }

  destroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    this.store.clear();
  }
}

// Singleton shared across the server process
export const cache = new MemoryCache();

// TTL constants (seconds)
export const TTL = {
  CATEGORIES: 5 * 60,       // 5 min — rarely changes
  FEATURED_PACKS: 3 * 60,   // 3 min
  TRENDING_PACKS: 2 * 60,   // 2 min
  PACK_LIST: 60,             // 1 min — paginated lists
  PACK_DETAIL: 2 * 60,      // 2 min per pack slug
  BESTSELLERS: 5 * 60,      // 5 min
  STATS: 10 * 60,            // 10 min — stats pages
};

/**
 * Cache-aside pattern helper.
 * Returns cached value if present, otherwise calls `fetch()` and caches the result.
 */
export async function cacheAside<T>(key: string, ttl: number, fetch: () => Promise<T>): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;
  const value = await fetch();
  cache.set(key, value, ttl);
  return value;
}
