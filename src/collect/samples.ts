/**
 * Sample listings for the demo / offline fallback.
 * These drive the real parser → bridge → rule engine, so the rendered result
 * is genuine — only the input is bundled instead of fetched live from Encar.
 */
import type { EncarParsedData } from '@core/types/ParsedData.js';
import {
  sample001,
  sample006,
  sampleOilLeak,
  sampleIdeal,
} from './samples-data';

export interface SampleListing {
  id: string;
  label: string;
  hint: string;
  parsed: EncarParsedData;
}

export const SAMPLE_LISTINGS: SampleListing[] = [
  { id: 'ideal', label: '무사고 우량 매물', hint: '모든 항목 양호 예시', parsed: sampleIdeal },
  { id: 'killer', label: '렌트·보험공백 위험', hint: 'NEVER 판정 예시', parsed: sample001 },
  { id: 'personal', label: '개인 거래 매물', hint: '성능점검 미공개 예시', parsed: sample006 },
  { id: 'oilleak', label: '누유 발견 매물', hint: '주의 항목 예시', parsed: sampleOilLeak },
];
