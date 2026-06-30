/**
 * Analysis cache repository — port of `CacheDao`.
 * 24h TTL: entries are valid while `expiresAt > now`.
 */
import { idb, STORE_CACHE } from './idb';
import { type CacheEntry, CACHE_TTL_MS } from './types';

export const cacheRepo = {
  /** `SELECT * FROM cache WHERE carId = :carId AND expiresAt > :now` */
  async getValid(carId: string, now: number = Date.now()): Promise<CacheEntry | undefined> {
    const entry = await idb.get<CacheEntry>(STORE_CACHE, carId);
    if (!entry) return undefined;
    return entry.expiresAt > now ? entry : undefined;
  },

  /** `@Insert(onConflict = REPLACE)` — stamps cachedAt/expiresAt (24h). */
  async upsert(
    entry: Omit<CacheEntry, 'cachedAt' | 'expiresAt'>,
    now: number = Date.now(),
  ): Promise<void> {
    const record: CacheEntry = { ...entry, cachedAt: now, expiresAt: now + CACHE_TTL_MS };
    await idb.put(STORE_CACHE, record);
  },

  /** `SELECT * FROM cache WHERE expiresAt > :now ORDER BY cachedAt DESC` */
  async getRecent(now: number = Date.now()): Promise<CacheEntry[]> {
    const all = await idb.getAll<CacheEntry>(STORE_CACHE);
    return all.filter((e) => e.expiresAt > now).sort((a, b) => b.cachedAt - a.cachedAt);
  },

  /** `DELETE FROM cache WHERE expiresAt <= :now` */
  async purgeExpired(now: number = Date.now()): Promise<void> {
    const all = await idb.getAll<CacheEntry>(STORE_CACHE);
    await Promise.all(
      all.filter((e) => e.expiresAt <= now).map((e) => idb.delete(STORE_CACHE, e.carId)),
    );
  },

  /** `DELETE FROM cache` */
  async clearAll(): Promise<void> {
    await idb.clear(STORE_CACHE);
  },

  /** `SELECT COUNT(*) FROM cache` */
  async count(): Promise<number> {
    return idb.count(STORE_CACHE);
  },
};
