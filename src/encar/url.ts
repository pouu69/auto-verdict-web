/**
 * Encar URL helpers — port of Android `EncarUrl` + the extension's url util.
 */

const CAR_DETAIL_RE = /\/cars\/detail\/(\d+)/;
const BASE_URL = 'https://fem.encar.com';

/** Encar landing page — opened so users can find a listing and copy its URL. */
export const HOME_URL = 'https://www.encar.com/';

export function extractCarId(url: string | null | undefined): string | null {
  if (!url) return null;
  return CAR_DETAIL_RE.exec(url)?.[1] ?? null;
}

export function isEncarDetail(url: string | null | undefined): boolean {
  return extractCarId(url) !== null;
}

export function buildDetailUrl(carId: string): string {
  return `${BASE_URL}/cars/detail/${carId}`;
}
