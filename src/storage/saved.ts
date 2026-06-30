/**
 * Saved-car repository — port of `SavedCarDao`.
 * Ordering, upsert (REPLACE), and multi-id lookup match the Room queries.
 */
import { idb, STORE_SAVED } from './idb';
import type { SavedCar } from './types';

export const savedRepo = {
  /** `SELECT * FROM saved_cars ORDER BY savedAt DESC` */
  async getAll(): Promise<SavedCar[]> {
    const all = await idb.getAll<SavedCar>(STORE_SAVED);
    return all.sort((a, b) => b.savedAt - a.savedAt);
  },

  /** `SELECT * FROM saved_cars WHERE carId = :carId` */
  async getByCarId(carId: string): Promise<SavedCar | undefined> {
    return idb.get<SavedCar>(STORE_SAVED, carId);
  },

  /** `SELECT * FROM saved_cars WHERE carId IN (:carIds)` (order follows input ids) */
  async getByCarIds(carIds: string[]): Promise<SavedCar[]> {
    const found = await Promise.all(carIds.map((id) => idb.get<SavedCar>(STORE_SAVED, id)));
    return found.filter((c): c is SavedCar => c !== undefined);
  },

  /** `@Insert(onConflict = REPLACE)` — preserves original savedAt on update. */
  async upsert(car: SavedCar): Promise<void> {
    const existing = await idb.get<SavedCar>(STORE_SAVED, car.carId);
    const now = Date.now();
    const record: SavedCar = existing
      ? { ...car, savedAt: existing.savedAt, updatedAt: now }
      : { ...car, savedAt: car.savedAt || now, updatedAt: now };
    await idb.put(STORE_SAVED, record);
  },

  /** `DELETE FROM saved_cars WHERE carId = :carId` */
  async deleteByCarId(carId: string): Promise<void> {
    await idb.delete(STORE_SAVED, carId);
  },

  /** `SELECT COUNT(*) FROM saved_cars` */
  async count(): Promise<number> {
    return idb.count(STORE_SAVED);
  },
};
