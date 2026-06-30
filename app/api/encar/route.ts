/**
 * Encar collection proxy (server-side).
 *
 * The browser cannot read another origin's `window.__PRELOADED_STATE__` nor
 * `fetch()` api.encar.com (CORS). The Android app and the Chrome extension
 * sidestep this by running inside the Encar page's own context. On the web we
 * reproduce that here: this server route runs WITHOUT CORS restrictions, so it
 * fetches the Encar detail page + the three readside APIs and returns the same
 * `MobileOrchestratorInput` envelope the evaluation engine expects.
 *
 * NOTE: Encar may rate-limit or block datacenter IPs, or require a login
 * cookie for some endpoints (record/diagnosis/inspection can each return
 * 401/404). The client falls back to sample data / manual JSON paste when this
 * route cannot return usable data. `httpStatus` is propagated so the engine can
 * degrade gracefully (the rule engine treats missing APIs as `unknown`, not an
 * error).
 */
import { NextResponse } from 'next/server';
import { extractCarId, buildDetailUrl } from '@/encar/url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FetchStatus = 'ok' | 'not_found' | 'unauthorized' | 'error' | 'skipped';

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  Referer: 'https://fem.encar.com/',
  Origin: 'https://fem.encar.com',
};

/** Extract the `window.__PRELOADED_STATE__ = {...}` object from page HTML. */
function extractPreloadedState(html: string): unknown | null {
  // Strategy 1: `window.__PRELOADED_STATE__ = { ... }`. Try each occurrence in
  // case the first is a reference rather than the assignment.
  const marker = '__PRELOADED_STATE__';
  let from = 0;
  for (let n = 0; n < 5; n++) {
    const at = html.indexOf(marker, from);
    if (at === -1) break;
    from = at + marker.length;
    const eq = html.indexOf('=', at);
    if (eq === -1) continue;
    const start = html.indexOf('{', eq);
    if (start === -1) continue;
    const parsed = parseBalancedObject(html, start);
    if (parsed && typeof parsed === 'object' && 'cars' in (parsed as object)) {
      return parsed;
    }
  }

  // Strategy 2: Next.js hydration blob <script id="__NEXT_DATA__">{…}</script>.
  return extractNextData(html);
}

/** Parse a balanced `{…}` object literal starting at `start`, respecting strings. */
function parseBalancedObject(html: string, start: number): unknown | null {
  let depth = 0;
  let inStr = false;
  let quote = '';
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i]!;
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Fallback extractor: find a `cars` object (with a `base`) inside __NEXT_DATA__. */
function extractNextData(html: string): { cars?: unknown } | null {
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!m || !m[1]) return null;
  try {
    const cars = findCars(JSON.parse(m[1]));
    return cars ? { cars } : null;
  } catch {
    return null;
  }
}

function findCars(obj: unknown, depth = 0): unknown | null {
  if (!obj || typeof obj !== 'object' || depth > 6) return null;
  const rec = obj as Record<string, unknown>;
  if (rec.cars && typeof rec.cars === 'object' && 'base' in (rec.cars as object)) {
    return rec.cars;
  }
  for (const value of Object.values(rec)) {
    const found = findCars(value, depth + 1);
    if (found) return found;
  }
  return null;
}

async function fetchApi(url: string): Promise<{ body: unknown | null; status: FetchStatus }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const r = await fetch(url, { headers: BROWSER_HEADERS, signal: controller.signal });
    clearTimeout(timer);
    if (r.status === 404) return { body: null, status: 'not_found' };
    if (r.status === 401 || r.status === 403) return { body: null, status: 'unauthorized' };
    if (!r.ok) return { body: null, status: 'error' };
    try {
      return { body: await r.json(), status: 'ok' };
    } catch {
      return { body: null, status: 'error' };
    }
  } catch {
    return { body: null, status: 'error' };
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const carId = searchParams.get('carId') ?? extractCarId(rawUrl);

  // Hard-validate: carId must be digits only. This is the sole user-controlled
  // value interpolated into the outbound encar URL, so constraining it keeps the
  // route a fixed encar-only proxy (no SSRF to other hosts/paths).
  if (!carId || !/^\d+$/.test(carId)) {
    return NextResponse.json(
      { error: 'invalid_url', message: '유효한 엔카 매물 URL이 아닙니다.' },
      { status: 400 },
    );
  }

  const detailUrl = buildDetailUrl(carId);

  // 1) Load the detail page (one retry on 429 / network error — basic
  //    rate-limit resilience; the client also caches results 24h in IndexedDB).
  let html: string | null = null;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 450));
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const pageRes = await fetch(detailUrl, { headers: BROWSER_HEADERS, signal: controller.signal });
      clearTimeout(timer);
      lastStatus = pageRes.status;
      if (pageRes.status === 429) continue; // rate-limited — retry once
      if (!pageRes.ok) {
        return NextResponse.json(
          { error: 'page_fetch_failed', message: `엔카 페이지를 불러오지 못했습니다 (${pageRes.status}).` },
          { status: 502 },
        );
      }
      const text = await pageRes.text();
      // Defensive cap — the detail page is ~70KB; far larger is anomalous.
      if (text.length > 5_000_000) {
        return NextResponse.json(
          { error: 'page_too_large', message: '엔카 응답이 비정상적으로 큽니다.' },
          { status: 502 },
        );
      }
      html = text;
      break;
    } catch {
      // network/timeout — fall through to the next attempt
    }
  }
  if (html === null) {
    if (lastStatus === 429) {
      return NextResponse.json(
        { error: 'rate_limited', message: '엔카 요청이 일시적으로 제한되었습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: 'page_fetch_error', message: '엔카 페이지 요청 중 오류가 발생했습니다.' },
      { status: 502 },
    );
  }

  const state = extractPreloadedState(html) as
    | { cars?: { base?: { vehicleId?: number; vehicleNo?: string } } }
    | null;
  const cars = state?.cars;
  // Reject empty base too — encar returns a 200 page with `base: {}` for
  // missing/deleted listings and when rate-limited (matches the Android
  // collector's `Object.keys(base).length === 0` guard).
  if (!cars || !cars.base || Object.keys(cars.base).length === 0) {
    // Encar serves a 200 page with empty base both for deleted listings and
    // when throttling ("restricted by traffic limits") — distinguish them.
    const rateLimited = /restricted by traffic|traffic limit|too many request/i.test(html);
    return NextResponse.json(
      rateLimited
        ? {
            error: 'rate_limited',
            message: '엔카 요청이 일시적으로 제한되었습니다. 잠시 후 다시 시도해주세요.',
          }
        : {
            error: 'state_not_found',
            message: '매물 데이터를 찾을 수 없습니다. 삭제되었거나 일시적으로 차단되었을 수 있습니다.',
          },
      { status: rateLimited ? 429 : 422 },
    );
  }

  const base = cars.base;
  const vehicleId = typeof base.vehicleId === 'number' ? base.vehicleId : undefined;
  const vehicleNo = typeof base.vehicleNo === 'string' ? base.vehicleNo : undefined;

  // 2) Fetch the three readside APIs in parallel (when we have a vehicleId).
  const httpStatus: Record<string, FetchStatus> = {
    recordJson: 'skipped',
    diagnosisJson: 'skipped',
    inspectionJson: 'skipped',
  };
  let recordJson: unknown = null;
  let diagnosisJson: unknown = null;
  let inspectionJson: unknown = null;

  if (vehicleId !== undefined) {
    const tasks: Array<Promise<void>> = [];
    if (vehicleNo) {
      tasks.push(
        fetchApi(
          `https://api.encar.com/v1/readside/record/vehicle/${vehicleId}/open?vehicleNo=${encodeURIComponent(vehicleNo)}`,
        ).then((r) => {
          recordJson = r.body;
          httpStatus.recordJson = r.status;
        }),
      );
    }
    tasks.push(
      fetchApi(`https://api.encar.com/v1/readside/diagnosis/vehicle/${vehicleId}`).then((r) => {
        diagnosisJson = r.body;
        httpStatus.diagnosisJson = r.status;
      }),
    );
    tasks.push(
      fetchApi(`https://api.encar.com/v1/readside/inspection/vehicle/${vehicleId}`).then((r) => {
        inspectionJson = r.body;
        httpStatus.inspectionJson = r.status;
      }),
    );
    await Promise.all(tasks);
  }

  // 3) Return the MobileOrchestratorInput envelope.
  return NextResponse.json({
    url: detailUrl,
    carId,
    preloadedState: { cars },
    recordJson,
    diagnosisJson,
    inspectionJson,
    httpStatus,
  });
}
