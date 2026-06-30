/**
 * Client-side collector — calls the /api/encar server proxy and returns the
 * MobileOrchestratorInput envelope. Throws CollectError (with a user-facing
 * Korean message) when the proxy cannot return usable data, so the UI can
 * offer the sample / paste-JSON fallback.
 */
import type { MobileOrchestratorInput } from '@/orchestrate-mobile';
import { extractCarId } from '@/encar/url';

export class CollectError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'CollectError';
    this.code = code;
  }
}

export async function collectFromUrl(url: string): Promise<MobileOrchestratorInput> {
  const carId = extractCarId(url);
  if (!carId) {
    throw new CollectError('invalid_url', '유효한 엔카 매물 URL이 아닙니다.');
  }
  return collectFromCarId(carId, url);
}

export async function collectFromCarId(
  carId: string,
  url?: string,
): Promise<MobileOrchestratorInput> {
  const params = new URLSearchParams({ carId });
  if (url) params.set('url', url);

  let res: Response;
  try {
    res = await fetch(`/api/encar?${params.toString()}`);
  } catch {
    throw new CollectError('network', '네트워크 오류로 분석을 시작하지 못했습니다.');
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok || !data || typeof data !== 'object') {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as Record<string, unknown>).message)
        : '엔카에서 매물 데이터를 가져오지 못했습니다.';
    const code =
      data && typeof data === 'object' && 'error' in data
        ? String((data as Record<string, unknown>).error)
        : 'collect_failed';
    throw new CollectError(code, message);
  }

  return data as MobileOrchestratorInput;
}

/** Parse a user-pasted JSON string into a MobileOrchestratorInput. */
export function parsePastedInput(text: string): MobileOrchestratorInput {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new CollectError('parse', 'JSON 형식이 올바르지 않습니다.');
  }
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('carId' in raw) ||
    !('preloadedState' in raw)
  ) {
    throw new CollectError('shape', 'carId / preloadedState 필드가 필요합니다.');
  }
  return raw as MobileOrchestratorInput;
}
