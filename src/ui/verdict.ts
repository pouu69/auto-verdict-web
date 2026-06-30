/** Shared verdict + score-color helpers (extracted from the overlay ScoreCard). */
import type { Verdict } from '@core/types/RuleTypes.js';
import { color } from '@/tokens';

export const verdictDisplay: Record<Verdict, { label: string; bg: string; text: string }> = {
  OK: { label: 'OK', bg: color.successBg, text: color.success },
  CAUTION: { label: 'CAUTION', bg: color.warningBg, text: color.warning },
  NEVER: { label: 'NEVER', bg: color.dangerBg, text: color.danger },
  UNKNOWN: { label: 'UNKNOWN', bg: color.unknownBg, text: color.textSecondary },
};

const COLOR_STOPS: [number, [number, number, number]][] = [
  [0, [198, 40, 40]],
  [30, [230, 81, 0]],
  [50, [245, 127, 23]],
  [65, [158, 157, 36]],
  [78, [46, 125, 50]],
  [88, [0, 137, 123]],
  [100, [21, 101, 192]],
];

/** Continuous score → color (0=red … 100=blue), same gradient as ScoreCard. */
export function scoreColor(score: number): string {
  const s = Math.max(0, Math.min(100, score));
  let lo = COLOR_STOPS[0]!;
  let hi = COLOR_STOPS[COLOR_STOPS.length - 1]!;
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (s >= COLOR_STOPS[i]![0] && s <= COLOR_STOPS[i + 1]![0]) {
      lo = COLOR_STOPS[i]!;
      hi = COLOR_STOPS[i + 1]!;
      break;
    }
  }
  const t = hi[0] === lo[0] ? 0 : (s - lo[0]) / (hi[0] - lo[0]);
  const r = Math.round(lo[1][0] + (hi[1][0] - lo[1][0]) * t);
  const g = Math.round(lo[1][1] + (hi[1][1] - lo[1][1]) * t);
  const b = Math.round(lo[1][2] + (hi[1][2] - lo[1][2]) * t);
  return `rgb(${r},${g},${b})`;
}

export function formatPriceWon(priceWon: number | null): string {
  if (!priceWon) return '-';
  const man = Math.round(priceWon / 10000);
  if (man >= 10000) return `${(man / 10000).toFixed(1)}억`;
  return `${man.toLocaleString('ko-KR')}만원`;
}

export function formatMileage(km: number | null): string {
  if (km === null) return '-';
  return `${(km / 10000).toFixed(1)}만km`;
}
