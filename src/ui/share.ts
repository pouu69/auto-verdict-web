/**
 * Web Share Target handling — port of Android `MainActivity.handleShareIntent`.
 * When the installed PWA receives a share, the OS opens `/?title=&text=&url=`.
 * We pull an Encar detail URL out of whichever field carries it.
 */
import { extractCarId } from '@/encar/url';

/** Returns a shared Encar detail URL from the current location, or null. */
export function readSharedEncarUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const candidates = [params.get('url'), params.get('text'), params.get('title')];
  for (const candidate of candidates) {
    if (!candidate) continue;
    // `text` may be "차량명 https://fem.encar.com/cars/detail/123" — scan tokens.
    for (const token of candidate.split(/\s+/)) {
      if (extractCarId(token)) return token;
    }
  }
  return null;
}

/** Remove the share query params so a refresh doesn't re-trigger analysis. */
export function clearShareParams(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', window.location.pathname);
}
