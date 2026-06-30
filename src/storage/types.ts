/**
 * Web storage shapes — direct port of the Android Room entities.
 * SavedCarEntity (saved_cars) and CacheEntity (cache) become IndexedDB object
 * stores keyed by `carId`. Field names/types are preserved 1:1 so the saved
 * payload stays compatible across platforms.
 */

/** Port of `SavedCarEntity` (table `saved_cars`, PK `carId`). */
export interface SavedCar {
  carId: string;
  url: string;
  title: string;
  year: number | null;
  mileageKm: number | null;
  priceWon: number | null;
  fuelType: string | null;
  score: number;
  verdict: string;
  dangerCount: number;
  cautionCount: number;
  passCount: number;
  unknownCount: number;
  /** JSON string of the original MobileOrchestratorInput — re-run bridge+rules on read. */
  rawJson: string;
  savedAt: number;
  updatedAt: number;
}

/** Port of `CacheEntity` (table `cache`, PK `carId`) — 24h TTL raw analysis cache. */
export interface CacheEntry {
  carId: string;
  url: string;
  title: string;
  score: number;
  verdict: string;
  resultJson: string;
  rawInputJson: string;
  cachedAt: number;
  expiresAt: number;
}

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
